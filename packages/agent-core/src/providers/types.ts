import type { Message } from "../types";

// One tool description as the model sees it — name + JSON Schema for args,
// produced by z.toJSONSchema(tool.args) at the call site (D10).
export interface ToolSpec {
  name: string;
  description: string;
  argsSchema: unknown; // JSON Schema, not a Zod schema — providers don't know Zod
}

export type ProviderChunk =
  | { type: "text_delta"; delta: string }
  // `providerMeta` is an opaque blob the provider asked us to hand back
  // verbatim on the next request. agent-core never inspects it — it only
  // has to survive the round trip through Message history. Gemini needs
  // this (a per-call `thought_signature`); the other hosts ignore it.
  | {
      type: "tool_call";
      toolCallId: string;
      toolName: string;
      args: unknown;
      argsError?: string;
      providerMeta?: unknown;
    }
  // Real token counts, reported once at the end of a stream. Optional by
  // design: FakeProvider never sends it, and a provider that stops
  // reporting usage must degrade to "cost unknown", not to a crash.
  | { type: "usage"; inputTokens: number; outputTokens: number }
  | {
      type: "stop";
      reason: "end_turn" | "tool_use" | "length";
      providerMeta?: unknown;
    };

export interface Provider {
  // The model id this provider is bound to — the loop needs it to price a
  // turn, and asking the provider is the only place that cannot go stale.
  readonly model: string;
  stream(
    messages: Message[],
    tools: ToolSpec[],
    opts: { signal: AbortSignal },
  ): AsyncIterable<ProviderChunk>;
}
