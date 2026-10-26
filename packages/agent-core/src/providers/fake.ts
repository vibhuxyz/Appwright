import type { Message } from "../types";
import type { Provider, ProviderChunk, TokenUsage, ToolSpec } from "./types";

// FakeProvider — scripted responses, built BEFORE the real provider (per the
// version doc: this is how you test truncation, tool errors, and the exit
// condition, none of which you can trigger reliably against a real model).
//
// Usage: hand it a queue of "turns". Each call to stream() pops the next
// turn and yields it as chunks, regardless of what messages/tools it's given.

// `usage` rides on any turn rather than being a turn of its own, because a
// real provider reports counts for the turn it just finished — including a
// tool-call turn. Making it a separate kind meant only text turns could
// cost money, and the loop's cost ceiling was untestable as a result.
export type ScriptedTurn = {
  usage?: TokenUsage;
} & (
  | { kind: "text"; text: string }
  | { kind: "toolCall"; toolCallId: string; toolName: string; args: unknown }
  | { kind: "lengthStop" } // simulates a provider truncation stop
);

export class FakeProvider implements Provider {
  private readonly turns: ScriptedTurn[];
  private cursor = 0;
  readonly model: string;

  constructor(turns: ScriptedTurn[], model = "fake-model") {
    this.turns = turns;
    this.model = model;
  }

  async *stream(
    _messages: Message[],
    _tools: ToolSpec[],
    _opts: { signal: AbortSignal },
  ): AsyncIterable<ProviderChunk> {
    const turn = this.turns[this.cursor++];
    if (!turn) {
      throw new Error("FakeProvider: script exhausted");
    }

    switch (turn.kind) {
      case "text":
        yield { type: "text_delta", delta: turn.text };
        yield { type: "stop", reason: "end_turn" };
        break;
      case "toolCall":
        yield {
          type: "tool_call",
          toolCallId: turn.toolCallId,
          toolName: turn.toolName,
          args: turn.args,
        };
        yield { type: "stop", reason: "tool_use" };
        break;
      case "lengthStop":
        yield { type: "stop", reason: "length" };
        break;
    }

    // After the stop, mirroring where OpenAI actually puts it.
    if (turn.usage) yield { type: "usage", ...turn.usage };
  }
}
