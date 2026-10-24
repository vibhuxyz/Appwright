import { describe, expect, test } from "bun:test";
import { FakeProvider } from "../src/providers/fake";
import { runAgentLoop, type Tool } from "../src/loop";
import type { AgentEvent, Message } from "../src/types";
import type { Runtime } from "../src/runtime";
import { z } from "zod";

const noopRuntime: Runtime = {
  readFile: async () => "",
  writeFile: async () => {},
  listDir: async () => [],
  exec: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
};

function freshBudget(
  overrides: Partial<Parameters<typeof runAgentLoop>[0]["budget"]> = {},
) {
  return {
    maxIterations: 10,
    maxTokens: 100_000,
    maxCostUsd: 5,
    deadline: Date.now() + 60_000,
    ...overrides,
  };
}

const echoTool: Tool = {
  name: "echo",
  description: "returns whatever it's given",
  args: z.object({}),
  executionMode: "parallel",
  execute: async () => "ok",
};

type LoopParams = Parameters<typeof runAgentLoop>[0];

function baseParams(
  overrides: Partial<LoopParams> & Pick<LoopParams, "provider">,
) {
  const messages: Message[] = [{ role: "user", type: "text", content: "hi" }];
  return {
    messages,
    tools: [echoTool],
    runtime: noopRuntime,
    emit: (async (_e: AgentEvent) => {}) as Parameters<
      typeof runAgentLoop
    >[0]["emit"],
    budget: freshBudget(),
    signal: new AbortController().signal,
    sessionId: "test-session",
    ...overrides,
  };
}

describe("runAgentLoop — the six exits", () => {
  test("completed: no tool calls ends the run", async () => {
    const provider = new FakeProvider([{ kind: "text", text: "done" }]);
    const stopReason = await runAgentLoop(baseParams({ provider }));
    expect(stopReason).toBe("completed");
  });

  test("cancelled: an already-aborted signal stops before calling the provider", async () => {
    const controller = new AbortController();
    controller.abort();
    const provider = new FakeProvider([
      { kind: "text", text: "should never be read" },
    ]);
    const stopReason = await runAgentLoop(
      baseParams({ provider, signal: controller.signal }),
    );
    expect(stopReason).toBe("cancelled");
  });

  test("timeout: a deadline already in the past stops immediately", async () => {
    const provider = new FakeProvider([
      { kind: "text", text: "should never be read" },
    ]);
    const stopReason = await runAgentLoop(
      baseParams({
        provider,
        budget: freshBudget({ deadline: Date.now() - 1 }),
      }),
    );
    expect(stopReason).toBe("timeout");
  });

  test("maxIterations: a tool-calling loop stops once the cap is hit", async () => {
    const provider = new FakeProvider([
      { kind: "toolCall", toolCallId: "1", toolName: "echo", args: {} },
      { kind: "toolCall", toolCallId: "2", toolName: "echo", args: {} },
    ]);
    const stopReason = await runAgentLoop(
      baseParams({ provider, budget: freshBudget({ maxIterations: 1 }) }),
    );
    expect(stopReason).toBe("maxIterations");
  });

  test("budgetExceeded: a low token budget stops the loop after one turn", async () => {
    const provider = new FakeProvider([
      { kind: "toolCall", toolCallId: "1", toolName: "echo", args: {} },
      { kind: "text", text: "should never be reached" },
    ]);
    const stopReason = await runAgentLoop(
      baseParams({ provider, budget: freshBudget({ maxTokens: 1 }) }),
    );
    expect(stopReason).toBe("budgetExceeded");
  });

  test("fatalError: a provider that throws is caught, not left to crash the process", async () => {
    const throwingProvider = {
      model: "fake-model",
      async *stream(): AsyncIterable<never> {
        throw new Error("provider exploded");
      },
    };
    const stopReason = await runAgentLoop(
      baseParams({ provider: throwingProvider }),
    );
    expect(stopReason).toBe("fatalError");
  });

  test("retries a transient 429 then completes without marking the phase done early", async () => {
    let calls = 0;
    const provider = {
      model: "fake-model",
      async *stream() {
        calls += 1;
        if (calls === 1) throw new Error("OpenAI request failed: 429 rate limit");
        yield { type: "text_delta" as const, delta: "recovered" };
        yield { type: "stop" as const, reason: "end_turn" as const };
      },
    };
    const stopReason = await runAgentLoop(
      baseParams({ provider, providerRetryDelayMs: 0 }),
    );
    expect(stopReason).toBe("completed");
    expect(calls).toBe(2);
  });

  test("does not retry a non-transient provider explosion", async () => {
    let calls = 0;
    const provider = {
      model: "fake-model",
      async *stream(): AsyncIterable<never> {
        calls += 1;
        throw new Error("provider exploded");
      },
    };
    const stopReason = await runAgentLoop(
      baseParams({ provider, providerRetryDelayMs: 0 }),
    );
    expect(stopReason).toBe("fatalError");
    expect(calls).toBe(1);
  });

  test("falls back to the next configured provider after transient failures", async () => {
    let primaryCalls = 0;
    const primary = {
      model: "gpt-4o-mini",
      async *stream(): AsyncIterable<never> {
        primaryCalls += 1;
        throw new Error("OpenAI request failed: 503 unavailable");
      },
    };
    const fallback = new FakeProvider([{ kind: "text", text: "from fallback" }], "deepseek-chat");
    const events: AgentEvent[] = [];
    const stopReason = await runAgentLoop(
      baseParams({
        provider: primary,
        fallbackProviders: [fallback],
        providerRetryDelayMs: 0,
        emit: async (event) => {
          events.push(event);
        },
      }),
    );
    expect(stopReason).toBe("completed");
    expect(primaryCalls).toBe(3);
    expect(events.some((event) => event.type === "text_delta" && event.delta === "from fallback")).toBe(
      true,
    );
  });

  test("every run emits agent_start then agent_end with a matching stopReason", async () => {
    const provider = new FakeProvider([{ kind: "text", text: "done" }]);
    const events: AgentEvent[] = [];
    const stopReason = await runAgentLoop(
      baseParams({ provider, emit: async (e) => void events.push(e) }),
    );

    expect(events[0]?.type).toBe("agent_start");
    const last = events[events.length - 1];
    expect(last?.type).toBe("agent_end");
    expect(last && "stopReason" in last && last.stopReason).toBe(stopReason);
  });

  test("a missing toolResponse never happens — every tool call gets one, even unknown tools", async () => {
    const provider = new FakeProvider([
      {
        kind: "toolCall",
        toolCallId: "1",
        toolName: "does_not_exist",
        args: {},
      },
      { kind: "text", text: "recovered" },
    ]);
    const stopReason = await runAgentLoop(baseParams({ provider }));
    expect(stopReason).toBe("completed");
  });

  test("onApprovalRequired denies tool execution when unapproved", async () => {
    let executed = false;
    const tools = [
      {
        name: "test_tool",
        description: "test tool",
        args: z.object({}),
        executionMode: "sequential" as const,
        execute: async () => {
          executed = true;
          return "ok";
        },
      },
    ];
    const provider = new FakeProvider([
      {
        kind: "toolCall",
        toolCallId: "call_1",
        toolName: "test_tool",
        args: {},
      },
      { kind: "text", text: "handled denial" },
    ]);
    const onApprovalRequired = async () => ({
      approved: false,
      reason: "User denied permission",
    });
    const stopReason = await runAgentLoop({
      ...baseParams({ provider, tools }),
      onApprovalRequired,
    });
    expect(stopReason).toBe("completed");
    expect(executed).toBe(false);
  });

  test("passes assistant text message with providerMeta to subsequent turns", async () => {
    const receivedHistories: Message[][] = [];
    const provider = {
      model: "fake-model",
      async *stream(messages: Message[]): AsyncIterable<import("../src/providers/types").ProviderChunk> {
        receivedHistories.push([...messages]);
        if (receivedHistories.length === 1) {
          yield { type: "text_delta", delta: "working on it" };
          yield {
            type: "tool_call",
            toolCallId: "call_1",
            toolName: "echo",
            args: {},
          };
          yield {
            type: "stop",
            reason: "tool_use",
            providerMeta: { reasoningContent: "step 1 completed" },
          };
        } else {
          yield { type: "text_delta", delta: "all done" };
          yield { type: "stop", reason: "end_turn" };
        }
      },
    };
    const stopReason = await runAgentLoop(baseParams({ provider }));
    expect(stopReason).toBe("completed");
    expect(receivedHistories).toHaveLength(2);
    const turn2Messages = receivedHistories[1];
    const assistantTextMsg = turn2Messages?.find(
      (m) => m.type === "text" && m.role === "assistant",
    );
    expect(assistantTextMsg?.type === "text" && assistantTextMsg.providerMeta).toEqual({
      reasoningContent: "step 1 completed",
    });
  });
});
