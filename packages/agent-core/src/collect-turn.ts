import type { Provider, ProviderChunk, TokenUsage, ToolSpec } from "./providers/types";
import type { AgentEventSink, Message } from "./types";

export interface PendingToolCall {
  toolCallId: string;
  toolName: string;
  args: unknown;
  argsError?: string;
  providerMeta?: unknown;
}

export interface CollectedTurn {
  text: string;
  toolCalls: PendingToolCall[];
  stopReason: ProviderChunk & { type: "stop" };
  usage?: TokenUsage;
  providerMeta?: unknown;
}

export async function collectTurn(
  provider: Provider,
  messages: Message[],
  toolSpecs: ToolSpec[],
  signal: AbortSignal,
  emit: AgentEventSink,
  sessionId: string,
  nextSeq: () => number,
): Promise<CollectedTurn> {
  let text = "";
  const toolCalls: PendingToolCall[] = [];
  let stop: (ProviderChunk & { type: "stop" }) | undefined;
  let usage: TokenUsage | undefined;

  for await (const chunk of provider.stream(messages, toolSpecs, { signal })) {
    if (chunk.type === "text_delta") {
      text += chunk.delta;
      await emit({
        type: "text_delta",
        seq: nextSeq(),
        sessionId,
        delta: chunk.delta,
      });
    } else if (chunk.type === "tool_call") {
      toolCalls.push({
        toolCallId: chunk.toolCallId,
        toolName: chunk.toolName,
        args: chunk.args,
        ...(chunk.argsError ? { argsError: chunk.argsError } : {}),
        providerMeta: chunk.providerMeta,
      });
    } else if (chunk.type === "usage") {
      usage = {
        inputTokens: chunk.inputTokens,
        outputTokens: chunk.outputTokens,
        ...(chunk.cachedInputTokens ? { cachedInputTokens: chunk.cachedInputTokens } : {}),
      };
    } else if (chunk.type === "stop") {
      stop = chunk;
    }
  }

  if (!stop) {
    throw new Error("provider.stream() ended without a stop chunk");
  }

  return {
    text,
    toolCalls,
    stopReason: stop,
    usage,
    providerMeta: stop.providerMeta,
  };
}
