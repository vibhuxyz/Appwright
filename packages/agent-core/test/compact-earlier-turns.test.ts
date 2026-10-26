import { describe, expect, test } from "bun:test";
import { toOpenAiMessages } from "../src/providers/openai";
import { compactEarlierTurns } from "../src/transcript";
import type { Message } from "../src/types";

const earlier: Message[] = [
  { role: "user", type: "text", content: "Build it", attachments: [{ name: "a.pdf", mimeType: "application/pdf", type: "pdf", sizeBytes: 10, extractedText: "long pdf text", status: "COMPLETED" }] },
  { role: "assistant", type: "toolCall", toolCallId: "c1", content: { toolName: "read_file", args: { path: "x" }, providerMeta: { reasoningContent: "why" } } },
  { role: "tool", type: "toolResponse", toolCallId: "c1", content: "file body" },
  { role: "assistant", type: "text", content: "Done", providerMeta: { reasoningContent: "old thoughts" } },
];

describe("compactEarlierTurns", () => {
  test("sends earlier turns as plain text with no tool traffic, attachments or reasoning on the wire", () => {
    const wire = JSON.stringify(toOpenAiMessages(compactEarlierTurns(earlier)));
    expect(wire).not.toContain("reasoning_content");
    expect(wire).not.toContain("long pdf text");
    expect(wire).not.toContain("file body");
    expect(wire).toContain("a.pdf (pdf)");
    expect(wire).toContain("Done");
  });

  test("does not mutate its input", () => {
    const copy = structuredClone(earlier);
    compactEarlierTurns(earlier);
    expect(earlier).toEqual(copy);
  });
});
