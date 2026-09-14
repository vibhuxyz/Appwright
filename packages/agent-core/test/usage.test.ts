import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { runAgentLoop, type Tool } from "../src/loop";
import { FakeProvider } from "../src/providers/fake";
import { costUsd, priceFor } from "../src/providers/pricing";
import type { AgentEvent, Message } from "../src/types";
import type { Runtime } from "../src/runtime";

const noopRuntime: Runtime = {
  readFile: async () => "",
  writeFile: async () => {},
  listDir: async () => [],
  exec: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
};

const echoTool: Tool = {
  name: "echo",
  description: "returns whatever it's given",
  args: z.object({}),
  executionMode: "parallel",
  execute: async () => "ok",
};

async function run(
  provider: FakeProvider,
  budget: Partial<Parameters<typeof runAgentLoop>[0]["budget"]> = {},
) {
  const events: AgentEvent[] = [];
  const messages: Message[] = [{ role: "user", type: "text", content: "hi" }];
  const stopReason = await runAgentLoop({
    messages,
    tools: [echoTool],
    provider,
    runtime: noopRuntime,
    emit: async (e) => void events.push(e),
    budget: {
      maxIterations: 10,
      maxTokens: 100_000,
      maxCostUsd: 5,
      deadline: Date.now() + 60_000,
      ...budget,
    },
    signal: new AbortController().signal,
    sessionId: "s1",
  });
  return { stopReason, events };
}

describe("usage accounting", () => {
  test("an unpriced model is not free — it falls back to its family's top price", () => {
    // A zero here would silently delete maxCostUsd for every model nobody
    // remembered to add to the table.
    expect(priceFor("gpt-9-not-released-yet").in).toBeGreaterThan(0);
    expect(costUsd("gpt-5.4-mini", 1_000_000, 0)).toBeCloseTo(0.25, 6);
    expect(costUsd("gpt-5.4-mini", 0, 1_000_000)).toBeCloseTo(2, 6);
  });

  test("a provider that reports usage emits one usage event carrying a real cost", async () => {
    const provider = new FakeProvider(
      [
        {
          kind: "text",
          text: "done",
          usage: { inputTokens: 1000, outputTokens: 500 },
        },
      ],
      "gpt-5.4-mini",
    );
    const { events } = await run(provider);
    const usage = events.filter((e) => e.type === "usage");
    expect(usage).toHaveLength(1);
    expect(usage[0]).toMatchObject({
      model: "gpt-5.4-mini",
      inputTokens: 1000,
      outputTokens: 500,
      costUsd: costUsd("gpt-5.4-mini", 1000, 500),
    });
  });

  test("a provider that reports no usage emits no usage event, and the run still ends", async () => {
    // FakeProvider's plain "text" turn is the silent-provider case. Cost
    // must degrade to unknown, never to a crash.
    const { stopReason, events } = await run(
      new FakeProvider([{ kind: "text", text: "done" }]),
    );
    expect(stopReason).toBe("completed");
    expect(events.some((e) => e.type === "usage")).toBe(false);
  });

  test("maxCostUsd is reachable — spend past the ceiling and the next turn never runs", async () => {
    const provider = new FakeProvider(
      [
        {
          kind: "toolCall",
          toolCallId: "c1",
          toolName: "echo",
          args: {},
          usage: { inputTokens: 1_000_000, outputTokens: 1_000_000 },
        },
        { kind: "text", text: "turn two should never happen" },
      ],
      "gpt-5.4-mini",
    );
    // Turn one costs 0.25 + 2.00 = $2.25, which is over this ceiling.
    const { stopReason } = await run(provider, { maxCostUsd: 1 });
    expect(stopReason).toBe("budgetExceeded");
  });
});
