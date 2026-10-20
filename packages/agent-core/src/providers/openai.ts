import type { Message } from "../types";
import type { Provider, ProviderChunk, ToolSpec } from "./types";

// OpenAiProvider — the one real provider for V0 (Slice 2). Talks to the Chat
// Completions streaming endpoint directly over fetch; no SDK dependency, so
// nothing new goes through deps.allow.json for this.
//
// Normalising OpenAI's wire format into the internal Message/ProviderChunk
// shape is the entire point of the Provider interface (D10/D-provider
// abstraction) — every other layer (loop, tools, events) never sees it.

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/chat/completions";
// Google ships an OpenAI-compatible surface alongside its native API, which
// is why Gemini needs no separate Provider class — same wire format, same
// bearer auth. It is compatible, not identical: see the two quirks handled
// in stream() below.
const GEMINI_CHAT_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

interface OpenAiChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
    // Gemini returns a per-call `thought_signature` here and *requires* it
    // back on the next request: without it the API rejects the whole
    // conversation with 400 INVALID_ARGUMENT. We store it opaquely and echo
    // it — agent-core never looks inside.
    extra_content?: unknown;
  }[];
  tool_call_id?: string;
}

// Our internal Message shape gives each tool call its own entry (types.ts —
// simpler for events/persistence, one row per call). OpenAI requires the
// opposite: when a model makes N tool calls in one turn, they must arrive as
// ONE assistant message with an array of N tool_calls, immediately followed
// by all N tool responses. Two separate assistant messages back to back
// (one call each) violates that ordering — OpenAI rejects the request with
// "assistant message with tool_calls must be followed by tool messages".
// So: merge consecutive toolCall messages into a single wire message here,
// rather than changing the internal shape everything else already relies on.
function toOpenAiMessages(messages: Message[]): OpenAiChatMessage[] {
  const result: OpenAiChatMessage[] = [];

  for (const m of messages) {
    if (m.type === "text") {
      result.push({ role: m.role, content: m.content });
      continue;
    }
    if (m.type === "toolResponse") {
      result.push({
        role: "tool",
        tool_call_id: m.toolCallId,
        content: m.content,
      });
      continue;
    }
    // m.type === "toolCall"
    const call = {
      id: m.toolCallId,
      type: "function" as const,
      function: {
        name: m.content.toolName,
        arguments: JSON.stringify(m.content.args),
      },
      ...(m.content.providerMeta
        ? { extra_content: m.content.providerMeta }
        : {}),
    };
    const last = result.at(-1);
    if (
      last?.role === "assistant" &&
      last.content === null &&
      last.tool_calls
    ) {
      last.tool_calls.push(call);
    } else {
      result.push({ role: "assistant", content: null, tool_calls: [call] });
    }
  }

  return result;
}

function toOpenAiTools(tools: ToolSpec[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.argsSchema,
    },
  }));
}

function mapFinishReason(reason: string): "end_turn" | "tool_use" | "length" {
  if (reason === "tool_calls") return "tool_use";
  if (reason === "length") return "length";
  return "end_turn";
}

// Every model the UI can pick, and where it actually goes. This used to be
// guessed from the model name — `startsWith("llama")`, `includes("groq")` —
// which sent `openai/gpt-oss-120b` and `qwen/qwen3.6-27b` to api.openai.com,
// because the provider is a property of the *connection*, not a substring of
// the label. A vendor renaming a model must not silently reroute it.
export type ProviderId = "openai" | "groq" | "xai" | "gemini" | "deepseek";

const ENDPOINTS: Record<ProviderId, { url: string; envKey: string }> = {
  openai: { url: OPENAI_CHAT_URL, envKey: "OPENAI_API_KEY" },
  groq: { url: GROQ_CHAT_URL, envKey: "GROQ_API_KEY" },
  xai: { url: XAI_CHAT_URL, envKey: "XAI_API_KEY" },
  gemini: { url: GEMINI_CHAT_URL, envKey: "GEMINI_API_KEY" },
  deepseek: { url: DEEPSEEK_CHAT_URL, envKey: "DEEPSEEK_API_KEY" },
};

export const MODEL_PROVIDERS: Record<string, ProviderId> = {
  "gpt-5.4": "openai",
  "gpt-5.4-mini": "openai",
  "gpt-5.2-codex": "openai",
  "gpt-4o-mini": "openai",
  "openai/gpt-oss-120b": "groq",
  "openai/gpt-oss-20b": "groq",
  "llama-3.3-70b-versatile": "groq",
  "llama-3.1-8b-instant": "groq",
  "qwen/qwen3.6-27b": "groq",
  "gemini-3.7-flash": "gemini",
  "gemini-3.1-pro-preview": "gemini",
  "gemini-flash-latest": "gemini",
  "deepseek-chat": "deepseek",
  "deepseek-reasoner": "deepseek",
};

export const DEFAULT_MODEL = process.env.DEFAULT_MODEL ?? "gpt-5.4-mini";

// An unlisted model is not an error — it is almost always a new OpenAI id.
// Explicit table first, prefix fallback second, so adding a model is a
// one-line change and a typo still reaches a real endpoint.
export function providerFor(model: string): ProviderId {
  const known = MODEL_PROVIDERS[model];
  if (known) return known;
  if (model.startsWith("grok")) return "xai";
  if (model.startsWith("deepseek")) return "deepseek";
  if (
    model.startsWith("llama") ||
    model.startsWith("mixtral") ||
    model.startsWith("gemma")
  ) {
    return "groq";
  }
  return "openai";
}

export interface OpenAiProviderOpts {
  apiKey?: string;
  model?: string;
}

export class OpenAiProvider implements Provider {
  private readonly apiKey: string;
  readonly model: string;

  private readonly baseUrl: string;

  constructor(opts: OpenAiProviderOpts = {}) {
    this.model = opts.model ?? DEFAULT_MODEL;

    const endpoint = ENDPOINTS[providerFor(this.model)];
    this.baseUrl = endpoint.url;
    this.apiKey = opts.apiKey ?? process.env[endpoint.envKey] ?? "";

    if (!this.apiKey) {
      throw new Error(
        `OpenAiProvider: ${endpoint.envKey} is not set, which ${this.model} needs.`,
      );
    }
  }

  async *stream(
    messages: Message[],
    tools: ToolSpec[],
    opts: { signal: AbortSignal },
  ): AsyncIterable<ProviderChunk> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      signal: opts.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        stream: true,
        messages: toOpenAiMessages(messages),
        tools: tools.length > 0 ? toOpenAiTools(tools) : undefined,
        // Without this, a streaming response carries no token counts at
        // all and every run costs $0.0000 forever. Sent to every host, not
        // just OpenAI: Gemini's compatible surface was assumed to report
        // usage unasked and does the opposite — verified against the live
        // API, it emits nothing without this flag and accepts it happily.
        // Guessing which hosts need it is what produced the wrong answer;
        // all four document it.
        stream_options: { include_usage: true },
      }),
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenAI request failed: ${res.status} ${body}`);
    }

    // Accumulate streamed tool-call argument fragments by index — OpenAI
    // sends each tool call's name once, then arguments in chunks.
    //
    // Gemini's compatible endpoint omits `index` entirely. Keying on
    // `undefined` merged every call in a turn into one entry: names and ids
    // overwritten, argument JSON from different calls concatenated into
    // garbage. Falling back to the call id keeps each one separate.
    const pendingToolCalls = new Map<
      string | number,
      { id: string; name: string; args: string; meta: unknown }
    >();
    let nextFallbackKey = 0;
    let emittedStop = false;
    // Kept, not yielded immediately. OpenAI sends usage once in a final
    // chunk that carries no choices; Gemini repeats a *cumulative* total on
    // every chunk. Last-write-wins is correct for both, and yielding once
    // at the end means the loop never double-counts a turn.
    let lastUsage: { inputTokens: number; outputTokens: number } | undefined;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice("data:".length).trim();
        if (data === "[DONE]") continue;

        const parsed = JSON.parse(data);

        // Before the choice check, not after: OpenAI's usage frame has an
        // empty choices array, so reading it later means never reading it.
        if (parsed.usage) {
          lastUsage = {
            inputTokens: parsed.usage.prompt_tokens ?? 0,
            outputTokens: parsed.usage.completion_tokens ?? 0,
          };
        }

        const choice = parsed.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta ?? {};

        if (typeof delta.content === "string" && delta.content.length > 0) {
          yield { type: "text_delta", delta: delta.content };
        }

        for (const tc of delta.tool_calls ?? []) {
          const key =
            typeof tc.index === "number"
              ? tc.index
              : (tc.id ?? `call-${nextFallbackKey++}`);
          const existing = pendingToolCalls.get(key) ?? {
            id: tc.id ?? "",
            name: tc.function?.name ?? "",
            args: "",
            meta: undefined as unknown,
          };
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.function?.arguments) existing.args += tc.function.arguments;
          if (tc.extra_content !== undefined) existing.meta = tc.extra_content;
          pendingToolCalls.set(key, existing);
        }

        if (choice.finish_reason) {
          for (const call of pendingToolCalls.values()) {
            yield {
              type: "tool_call",
              toolCallId: call.id,
              toolName: call.name,
              args: call.args ? JSON.parse(call.args) : {},
              providerMeta: call.meta,
            };
          }
          // Gemini reports finish_reason "stop" on a turn that *did* call a
          // tool, where OpenAI reports "tool_calls". Trusting the label ends
          // the run with the tool never executed — the model asks to read a
          // file and the loop just stops. What actually happened is not in
          // doubt: if calls were emitted, this turn is a tool turn.
          const reason =
            pendingToolCalls.size > 0
              ? "tool_use"
              : mapFinishReason(choice.finish_reason);
          pendingToolCalls.clear();
          emittedStop = true;
          yield { type: "stop", reason };
        }
      }
    }

    // A stream can end without ever sending finish_reason — gemini-3.1-pro
    // does exactly that. Tool calls were accumulated and then silently
    // dropped, and the loop got no stop chunk at all, so a turn that asked
    // to read a file did nothing and reported nothing. Never let the end of
    // the body be the end of the story: flush what we have.
    if (!emittedStop) {
      for (const call of pendingToolCalls.values()) {
        yield {
          type: "tool_call",
          toolCallId: call.id,
          toolName: call.name,
          args: call.args ? JSON.parse(call.args) : {},
          providerMeta: call.meta,
        };
      }
      yield {
        type: "stop",
        reason: pendingToolCalls.size > 0 ? "tool_use" : "end_turn",
      };
    }

    // After the stop, not before it. OpenAI's usage frame arrives in the
    // chunk *following* finish_reason, so yielding usage at the stop site
    // always yielded nothing. The loop consumes the whole stream rather
    // than breaking on stop, so a trailing usage chunk still lands.
    if (lastUsage) yield { type: "usage", ...lastUsage };
  }
}
