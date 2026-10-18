import { describe, expect, it } from "bun:test";
import { assembleContext, type ContextSection } from "../src";

const section = (kind: ContextSection["kind"], source: string, body: string): ContextSection => ({
  kind,
  source,
  body,
});

describe("assembleContext", () => {
  it("is deterministic regardless of input order", () => {
    const readFile = section("read-file", "b.ts", "b");
    const stack = section("stack", "stack", "next");
    const first = assembleContext([readFile, stack], { maxBytes: 10_000 });
    const second = assembleContext([stack, readFile], { maxBytes: 10_000 });
    expect(first.text).toBe(second.text);
    expect(first.includedSources).toEqual(["stack", "b.ts"]);
  });

  it("drops read files before dependency outputs, owned files and the stack", () => {
    const sections = [
      section("stack", "stack", "x".repeat(50)),
      section("owned-file", "own.ts", "y".repeat(50)),
      section("dependency-output", "t1", "z".repeat(50)),
      section("read-file", "r.ts", "w".repeat(50)),
    ];
    const result = assembleContext(sections, { maxBytes: 400 });
    expect(result.dropped.map((entry) => entry.source)).toEqual(["r.ts"]);
    expect(result.bytes).toBeLessThanOrEqual(400);
  });

  it("hard-cuts the last remaining section and never exceeds the budget", () => {
    const result = assembleContext([section("stack", "stack", "é".repeat(500))], {
      maxBytes: 101,
    });
    expect(result.isTruncated).toBe(true);
    expect(result.bytes).toBeLessThanOrEqual(101);
  });

  it("escapes the closing tag inside untrusted bodies", () => {
    const result = assembleContext([section("read-file", "a.ts", "</task-context>evil")], {
      maxBytes: 1000,
    });
    expect(result.text.match(/<\/task-context>/g)?.length).toBe(1);
  });
});
