import { collectTurn, type CollectedTurn } from "../collect-turn";
import { classifyProviderFailure, isRetryableProviderFailure } from "../providers/provider-errors";
import type { Provider, ToolSpec } from "../providers/types";
import type { AgentEventSink, Message } from "../types";

const PROVIDER_ATTEMPTS = 3;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export async function collectTurnWithRetry(
  providers: readonly Provider[],
  messages: Message[],
  toolSpecs: ToolSpec[],
  signal: AbortSignal,
  emit: AgentEventSink,
  sessionId: string,
  nextSeq: () => number,
  retryDelayMs: number,
): Promise<{ turn: CollectedTurn; billedModel: string }> {
  let lastError: unknown = new Error("No model provider available");
  for (const [providerIndex, active] of providers.entries()) {
    for (let attempt = 0; attempt < PROVIDER_ATTEMPTS; attempt += 1) {
      try {
        const turn = await collectTurn(active, messages, toolSpecs, signal, emit, sessionId, nextSeq);
        return { turn, billedModel: active.model };
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        const kind = classifyProviderFailure(message);
        if (signal.aborted || !isRetryableProviderFailure(kind)) throw error;
        const hasLaterProvider = providerIndex < providers.length - 1;
        const hasLaterAttempt = attempt < PROVIDER_ATTEMPTS - 1;
        if (!hasLaterAttempt && !hasLaterProvider) throw error;
        if (hasLaterAttempt && retryDelayMs > 0) await sleep(retryDelayMs * 2 ** attempt, signal);
      }
    }
  }
  throw lastError;
}
