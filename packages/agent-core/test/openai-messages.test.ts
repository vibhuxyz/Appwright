import { describe, expect, it } from "bun:test";
import { toOpenAiMessages } from "../src/providers/openai";
import type { Message } from "../src/types";

describe("toOpenAiMessages", () => {
  it("preserves reasoning_content on assistant text messages", () => {
    const messages: Message[] = [
      { role: "user", type: "text", content: "Plan project" },
      {
        role: "assistant",
        type: "text",
        content: "Here is the plan",
        providerMeta: { reasoningContent: "Step 1: analyze requirements" },
      },
    ];
    const wire = toOpenAiMessages(messages);
    expect(wire).toHaveLength(2);
    expect(wire[1]?.role).toBe("assistant");
    expect(wire[1]?.content).toBe("Here is the plan");
    expect(wire[1]?.reasoning_content).toBe("Step 1: analyze requirements");
  });

  it("merges assistant text and tool calls from the same turn with reasoning", () => {
    const messages: Message[] = [
      { role: "user", type: "text", content: "Read package.json" },
      {
        role: "assistant",
        type: "text",
        content: "I will explore the workspace",
        providerMeta: { reasoningContent: "Need to check dependencies" },
      },
      {
        role: "assistant",
        type: "toolCall",
        toolCallId: "call_123",
        content: {
          toolName: "read_file",
          args: { path: "package.json" },
          providerMeta: { reasoningContent: "Need to check dependencies" },
        },
      },
      {
        role: "tool",
        type: "toolResponse",
        toolCallId: "call_123",
        content: "{}",
      },
    ];
    const wire = toOpenAiMessages(messages);
    expect(wire).toHaveLength(3);
    const assistant = wire[1];
    expect(assistant?.role).toBe("assistant");
    expect(assistant?.content).toBe("I will explore the workspace");
    expect(assistant?.reasoning_content).toBe("Need to check dependencies");
    expect(assistant?.tool_calls).toHaveLength(1);
    expect(assistant?.tool_calls?.[0]?.id).toBe("call_123");
    expect(assistant?.tool_calls?.[0]?.function.name).toBe("read_file");
  });

  it("attaches reasoning from tool call when assistant text lacked it", () => {
    const messages: Message[] = [
      { role: "user", type: "text", content: "Explore" },
      {
        role: "assistant",
        type: "text",
        content: "Exploring files",
      },
      {
        role: "assistant",
        type: "toolCall",
        toolCallId: "call_abc",
        content: {
          toolName: "list_files",
          args: {},
          providerMeta: { reasoningContent: "Thinking about file structure" },
        },
      },
      {
        role: "tool",
        type: "toolResponse",
        toolCallId: "call_abc",
        content: "[]",
      },
    ];
    const wire = toOpenAiMessages(messages);
    expect(wire).toHaveLength(3);
    const assistant = wire[1];
    expect(assistant?.role).toBe("assistant");
    expect(assistant?.content).toBe("Exploring files");
    expect(assistant?.reasoning_content).toBe("Thinking about file structure");
    expect(assistant?.tool_calls).toHaveLength(1);
  });

  it("merges multiple tool calls into one assistant message", () => {
    const messages: Message[] = [
      { role: "user", type: "text", content: "Check two files" },
      {
        role: "assistant",
        type: "toolCall",
        toolCallId: "c1",
        content: {
          toolName: "read_file",
          args: { path: "a.ts" },
          providerMeta: { reasoningContent: "Comparing a and b" },
        },
      },
      {
        role: "assistant",
        type: "toolCall",
        toolCallId: "c2",
        content: {
          toolName: "read_file",
          args: { path: "b.ts" },
          providerMeta: { reasoningContent: "Comparing a and b" },
        },
      },
      { role: "tool", type: "toolResponse", toolCallId: "c1", content: "a" },
      { role: "tool", type: "toolResponse", toolCallId: "c2", content: "b" },
    ];
    const wire = toOpenAiMessages(messages);
    expect(wire).toHaveLength(4);
    const assistant = wire[1];
    expect(assistant?.role).toBe("assistant");
    expect(assistant?.content).toBeNull();
    expect(assistant?.reasoning_content).toBe("Comparing a and b");
    expect(assistant?.tool_calls).toHaveLength(2);
  });
});
