import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { runAgentLoop, type Tool } from "../src/loop";
import { parseToolArgs } from "../src/providers/parse-tool-args";
import type { Provider, ProviderChunk } from "../src/providers/types";
import type { AgentEvent, Message } from "../src/types";
import type { Runtime } from "../src/runtime";

const noopRuntime: Runtime = {
  readFile: async () => "",
  writeFile: async () => {},
  listDir: async () => [],
  exec: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
};

describe("parseToolArgs", () => {
  test("parses valid JSON", () => {
    expect(parseToolArgs('{"path":"a.ts"}')).toEqual({ args: { path: "a.ts" } });
  });

  test("treats empty arguments as an empty object", () => {
    expect(parseToolArgs("  ")).toEqual({ args: {} });
  });

  test("reports truncated JSON instead of throwing", () => {
    const parsed = parseToolArgs('{"path":"a.ts","content":"ab');
    expect(parsed.args).toEqual({});
    expect("argsError" in parsed && parsed.argsError).toContain("not valid JSON");
  });
});

function scriptedProvider(turns: readonly ProviderChunk[][]): Provider {
  const remaining = [...turns];
  return {
    model: "gpt-4o-mini",
    async *stream() {
      const turn = remaining.shift() ?? [{ type: "stop", reason: "end_turn" }];
      for (const chunk of turn) yield chunk;
    },
  };
}

describe("runAgentLoop with malformed tool arguments", () => {
  test("returns the parse error to the model and keeps running", async () => {
    const executed: unknown[] = [];
    const writeTool: Tool = {
      name: "write_file",
      description: "writes",
      args: z.object({}),
      executionMode: "sequential",
      execute: async (args) => {
        executed.push(args);
        return "ok";
      },
    };
    const provider = scriptedProvider([
      [
        { type: "tool_call", toolCallId: "c1", toolName: "write_file", args: {}, argsError: "bad json" },
        { type: "stop", reason: "tool_use" },
      ],
      [{ type: "text_delta", delta: "done" }, { type: "stop", reason: "end_turn" }],
    ]);
    const messages: Message[] = [{ role: "user", type: "text", content: "hi" }];
    const events: AgentEvent[] = [];
    const stopReason = await runAgentLoop({
      messages,
      tools: [writeTool],
      provider,
      runtime: noopRuntime,
      emit: async (event) => {
        events.push(event);
      },
      budget: { maxIterations: 5, maxTokens: 100_000, maxCostUsd: 5, deadline: Date.now() + 60_000 },
      signal: new AbortController().signal,
      sessionId: "test-session",
    });
    expect(stopReason).toBe("completed");
    expect(executed).toEqual([]);
    expect(events.some((event) => event.type === "tool_error" && event.error.includes("bad json"))).toBe(true);
  });
});
