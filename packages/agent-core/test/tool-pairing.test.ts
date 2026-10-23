import { describe, expect, test } from "bun:test";
import { FakeProvider } from "../src/providers/fake";
import { runAgentLoop, type Tool } from "../src/loop";
import { INTERRUPTED_TOOL_RESULT, repairToolPairing, type PairableMessage } from "../src/providers/tool-pairing";
import type { AgentEvent, Message } from "../src/types";
import type { Runtime } from "../src/runtime";
import { z } from "zod";

interface WireMessage extends PairableMessage {
  content?: string | null;
}

const stub = (toolCallId: string): WireMessage => ({ role: "tool", tool_call_id: toolCallId, content: INTERRUPTED_TOOL_RESULT });
const assistantCalling = (...ids: string[]): WireMessage => ({
  role: "assistant",
  content: null,
  tool_calls: ids.map((id) => ({ id })),
});
const result = (id: string): WireMessage => ({ role: "tool", tool_call_id: id, content: "ok" });
const user = (content: string): WireMessage => ({ role: "user", content });

describe("repairToolPairing", () => {
  test("leaves a complete history untouched", () => {
    const history = [user("hi"), assistantCalling("a", "b"), result("a"), result("b"), user("next")];
    expect(repairToolPairing(history, stub)).toEqual(history);
  });

  test("adds a result for a call the run never answered", () => {
    const repaired = repairToolPairing([user("hi"), assistantCalling("a", "b"), result("a"), user("next")], stub);
    expect(repaired.map((message) => `${message.role}:${message.tool_call_id ?? ""}`)).toEqual([
      "user:",
      "assistant:",
      "tool:a",
      "tool:b",
      "user:",
    ]);
    expect(repaired[3]?.content).toBe(INTERRUPTED_TOOL_RESULT);
  });

  test("answers a trailing call that has no results at all", () => {
    const repaired = repairToolPairing([user("hi"), assistantCalling("a")], stub);
    expect(repaired.at(-1)).toEqual(stub("a"));
  });

  test("drops a result whose call is not in the preceding assistant message", () => {
    const repaired = repairToolPairing([user("hi"), result("ghost"), assistantCalling("a"), result("a")], stub);
    expect(repaired.map((message) => message.role)).toEqual(["user", "assistant", "tool"]);
  });

  test("drops a duplicate result for the same call", () => {
    const repaired = repairToolPairing([assistantCalling("a"), result("a"), result("a")], stub);
    expect(repaired.filter((message) => message.role === "tool")).toHaveLength(1);
  });
});

describe("runAgentLoop closes unfinished tool calls", () => {
  test("a failure between a tool starting and finishing still records a result for that call", async () => {
    const runtime: Runtime = {
      readFile: async () => "",
      writeFile: async () => {},
      listDir: async () => [],
      exec: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
    };
    const echo: Tool = {
      name: "echo",
      description: "echo",
      args: z.object({}),
      executionMode: "sequential",
      execute: async () => "ok",
    };
    const events: AgentEvent[] = [];
    let hasFailedOnce = false;
    const emit = async (event: AgentEvent) => {
      if (event.type === "tool_call_end" && !hasFailedOnce) {
        hasFailedOnce = true;
        throw new Error("sink unavailable");
      }
      events.push(event);
    };
    const provider = new FakeProvider(
      [{ kind: "toolCall", toolCallId: "c1", toolName: "echo", args: {} }],
      "gpt-5.4-mini",
    );
    const messages: Message[] = [{ role: "user", type: "text", content: "go" }];
    const stopReason = await runAgentLoop({
      messages,
      tools: [echo],
      provider,
      runtime,
      emit,
      budget: { maxIterations: 5, maxTokens: 100_000, maxCostUsd: 5, deadline: Date.now() + 60_000 },
      signal: new AbortController().signal,
      sessionId: "s",
    });
    expect(stopReason).toBe("fatalError");
    const closing = events.find((event) => event.type === "tool_error");
    expect(closing).toMatchObject({ type: "tool_error", toolCallId: "c1" });
  });
});
