import { describe, expect, test } from "bun:test";
import { replaceStaleReads } from "../src/agent-loop";
import type { Message } from "../src/types";

function read(id: string, path: string, body: string): Message[] {
  return [
    { role: "assistant", type: "toolCall", toolCallId: id, content: { toolName: "read_file", args: { path } } },
    { role: "tool", type: "toolResponse", toolCallId: id, content: body },
  ];
}

describe("replaceStaleReads", () => {
  test("replaces an earlier read of the edited file and leaves other reads", () => {
    const messages: Message[] = [
      ...read("c1", "./src/app/page.tsx", "line 1\nline 2\nline 3"),
      ...read("c2", "src/env.ts", "TOKEN=1"),
    ];
    replaceStaleReads(messages, "src/app/page.tsx");
    expect(messages[1]).toMatchObject({ content: "[read src/app/page.tsx — 3 lines]" });
    expect(messages[3]).toMatchObject({ content: "TOKEN=1" });
  });
});
