import { describe, expect, it } from "bun:test";
import type { PersistFields } from "../src/worker/persist";
import { createEmitAdapter } from "../src/worker/emit-adapter";

function recordingAdapter() {
  const saved: PersistFields[] = [];
  const { emit } = createEmitAdapter({
    sessionId: "session-under-test",
    userId: "user-under-test",
    persist: async (fields) => {
      saved.push(fields);
    },
  });
  return { emit, saved };
}

describe("createEmitAdapter", () => {
  it("saves each narration line right before the tool call it introduces", async () => {
    const { emit, saved } = recordingAdapter();
    await emit({ type: "text_delta", seq: 1, sessionId: "s", delta: "The starter is untouched, " });
    await emit({ type: "text_delta", seq: 2, sessionId: "s", delta: "so I'm replacing it now." });
    await emit({ type: "tool_call_start", seq: 3, sessionId: "s", toolCallId: "call-1", toolName: "write_file", args: {} });
    await emit({ type: "tool_call_start", seq: 4, sessionId: "s", toolCallId: "call-2", toolName: "edit_file", args: {} });
    await emit({ type: "text_delta", seq: 5, sessionId: "s", delta: "## Done" });
    await emit({ type: "agent_end", seq: 6, sessionId: "s", stopReason: "completed" });

    expect(saved.map((row) => [row.type, row.content])).toEqual([
      ["text", "The starter is untouched, so I'm replacing it now."],
      ["toolCall", "write_file"],
      ["toolCall", "edit_file"],
      ["text", "## Done"],
    ]);
  });

  it("saves nothing for whitespace-only text", async () => {
    const { emit, saved } = recordingAdapter();
    await emit({ type: "text_delta", seq: 1, sessionId: "s", delta: "  \n" });
    await emit({ type: "agent_end", seq: 2, sessionId: "s", stopReason: "completed" });
    expect(saved).toEqual([]);
  });
});
