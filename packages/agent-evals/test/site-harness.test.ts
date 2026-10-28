import { describe, expect, test } from "bun:test";
import { FakeProvider } from "@repo/agent-core";
import { BudgetExceededError, MeteredProvider, SpendLedger } from "../src/site/budget";
import { findMissingImports } from "../src/site/capture";
import { GROUP_CONFIGS } from "../src/site/groups";
import { assertIsolatedDatabase, HarnessGuardError } from "../src/site/run/guards";

const MILLION = 1_000_000;
const MESSAGES = [{ role: "user" as const, type: "text" as const, content: "hi" }];

async function drain(provider: MeteredProvider): Promise<void> {
  for await (const _chunk of provider.stream(MESSAGES, [], { signal: new AbortController().signal })) void _chunk;
}

describe("metered provider and ledger", () => {
  test("records priced usage against the current generation", async () => {
    const ledger = new SpendLedger({ generationUsd: 1, totalUsd: 5 });
    ledger.beginGeneration("A-fashion");
    const provider = new MeteredProvider(new FakeProvider([{ kind: "text", text: "ok", usage: { inputTokens: MILLION, outputTokens: 0 } }], "deepseek-flash"), ledger);
    await drain(provider);
    expect(ledger.generationSpentUsd()).toBeCloseTo(0.3, 6);
    expect(ledger.entriesFor("A-fashion")).toHaveLength(1);
  });

  test("refuses the next call when it could pass the generation cap", async () => {
    const ledger = new SpendLedger({ generationUsd: 0.5, totalUsd: 5 });
    ledger.beginGeneration("B-saas");
    const usage = { inputTokens: MILLION, outputTokens: 0 };
    const provider = new MeteredProvider(new FakeProvider([{ kind: "text", text: "a", usage }, { kind: "text", text: "b", usage }], "deepseek-flash"), ledger);
    await drain(provider);
    await expect(drain(provider)).rejects.toBeInstanceOf(BudgetExceededError);
  });

  test("a new generation starts its own cap but shares the total", async () => {
    const ledger = new SpendLedger({ generationUsd: 0.4, totalUsd: 0.5 });
    const usage = { inputTokens: MILLION, outputTokens: 0 };
    const provider = new MeteredProvider(new FakeProvider([{ kind: "text", text: "a", usage }, { kind: "text", text: "b", usage }], "deepseek-flash"), ledger);
    ledger.beginGeneration("one");
    await drain(provider);
    ledger.beginGeneration("two");
    expect(ledger.generationSpentUsd()).toBe(0);
    await expect(drain(provider)).rejects.toMatchObject({ scope: "total" });
  });
});

describe("transport retry", () => {
  class FlakyProvider extends FakeProvider {
    calls = 0;
    override async *stream(...args: Parameters<FakeProvider["stream"]>) {
      this.calls += 1;
      if (this.calls === 1) throw new Error("The socket connection was closed unexpectedly");
      yield* super.stream(...args);
    }
  }

  test("retries a call that failed before any data and records the retry", async () => {
    const ledger = new SpendLedger({ generationUsd: 1, totalUsd: 5 });
    ledger.beginGeneration("flaky");
    const inner = new FlakyProvider([{ kind: "text", text: "ok", usage: { inputTokens: 10, outputTokens: 1 } }], "deepseek-flash");
    const provider = new MeteredProvider(inner, ledger);
    await drain(provider);
    expect(inner.calls).toBe(2);
    expect(provider.transportEvents).toHaveLength(1);
    expect(ledger.entriesFor("flaky")).toHaveLength(1);
  });
});

describe("findMissingImports", () => {
  const files = new Map([
    ["src/app/page.tsx", 'import { Hero } from "@/components/patterns/hero/cinematic-hero";\nimport { Missing } from "@/components/patterns/effects/gone";\nimport "./local.css";\nimport React from "react";'],
    ["src/components/patterns/hero/cinematic-hero.tsx", "export const Hero = 1;"],
    ["src/app/local.css", "body{}"],
    ["src/components/nav/index.ts", 'export { Nav } from "./nav";'],
  ]);

  test("reports only imports that resolve to no file", () => {
    expect(findMissingImports(files)).toEqual([
      { file: "src/components/nav/index.ts", specifier: "./nav" },
      { file: "src/app/page.tsx", specifier: "@/components/patterns/effects/gone" },
    ].sort((a, b) => (a.file < b.file ? -1 : 1)));
  });

  test("ignores package imports and accepts directory index files", () => {
    const sources = new Map([
      ["src/app/layout.tsx", 'import { Nav } from "@/components/nav";\nimport next from "next/font/google";'],
      ["src/components/nav/index.ts", "export const Nav = 1;"],
    ]);
    expect(findMissingImports(sources)).toEqual([]);
  });
});

describe("guards and groups", () => {
  test("refuses to run against a database that is not the stub", () => {
    expect(() => assertIsolatedDatabase({ DATABASE_URL: "postgresql://real-host:5432/app" })).toThrow(HarnessGuardError);
    expect(() => assertIsolatedDatabase({})).toThrow(HarnessGuardError);
    expect(() => assertIsolatedDatabase({ DATABASE_URL: "postgresql://stub.invalid:5432/stub" })).not.toThrow();
  });

  test("labels group B as the only run with shell delivery omitted", () => {
    expect(GROUP_CONFIGS.A.pipeline).toBe("task");
    expect(GROUP_CONFIGS.B).toMatchObject({ pipeline: "single-pass", shellPatterns: "omitted" });
    expect(GROUP_CONFIGS.C).toMatchObject({ pipeline: "single-pass", shellPatterns: "included" });
  });
});
