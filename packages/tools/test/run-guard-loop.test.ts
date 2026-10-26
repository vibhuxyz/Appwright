import { expect, test } from "bun:test";
import { FakeProvider, runAgentLoop, type AgentEvent, type Runtime } from "@repo/agent-core";
import { ALL_TOOLS, guardTools } from "../src";

const runtime: Runtime = {
  readFile: async () => "export const App = () => null;",
  writeFile: async () => {},
  listDir: async () => ["src/App.tsx"],
  exec: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
};

test("a second identical read inside one loop run returns the reuse note, not the file again", async () => {
  const events: AgentEvent[] = [];
  const guard = guardTools(ALL_TOOLS);
  const provider = new FakeProvider([
    { kind: "toolCall", toolCallId: "c1", toolName: "read_file", args: { path: "src/App.tsx" } },
    { kind: "toolCall", toolCallId: "c2", toolName: "read_file", args: { path: "src/App.tsx" } },
    { kind: "text", text: "done" },
  ]);
  const stopReason = await runAgentLoop({
    messages: [{ role: "user", type: "text", content: "look" }],
    tools: guard.tools,
    provider,
    runtime,
    emit: async (event) => {
      events.push(event);
    },
    budget: { maxIterations: 10, maxTokens: 100_000, maxCostUsd: 5, deadline: Date.now() + 60_000 },
    signal: new AbortController().signal,
    sessionId: "guard-loop",
  });
  const results = events.flatMap((event) => (event.type === "tool_call_end" ? [event.result] : []));
  expect(stopReason).toBe("completed");
  expect(results[0]).toContain("export const App");
  expect(results[1]).toContain("Unchanged since your earlier read_file call");
  expect(guard.stats().cacheHits).toBe(1);
});
