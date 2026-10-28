import { costUsd, type Message, type Provider, type ProviderChunk, type ToolSpec } from "@repo/agent-core";
import type { SpendLedger } from "./ledger";

export const MAX_TRANSPORT_RETRIES = 2;
export const CALL_TIMEOUT_MS = 300_000;
const RETRY_BACKOFF_MS = 2_000;

export interface TransportEvent {
  readonly attempt: number;
  readonly reason: string;
}

function describeFailure(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isAbortedByCaller(signal: AbortSignal): boolean {
  return signal.aborted;
}

export class MeteredProvider implements Provider {
  readonly model: string;
  readonly transportEvents: TransportEvent[] = [];

  constructor(
    private readonly inner: Provider,
    private readonly ledger: SpendLedger,
    private readonly onRequest: (messages: Message[]) => void = () => {},
  ) {
    this.model = inner.model;
  }

  async *stream(messages: Message[], tools: ToolSpec[], opts: { signal: AbortSignal }): AsyncIterable<ProviderChunk> {
    this.ledger.assertCanSpend();
    this.onRequest(messages);
    for (let attempt = 0; ; attempt += 1) {
      const callSignal = AbortSignal.any([opts.signal, AbortSignal.timeout(CALL_TIMEOUT_MS)]);
      let hasReceivedChunk = false;
      try {
        for await (const chunk of this.inner.stream(messages, tools, { signal: callSignal })) {
          hasReceivedChunk = true;
          this.recordUsage(chunk);
          yield chunk;
        }
        return;
      } catch (error) {
        const isRetryable = !hasReceivedChunk && !isAbortedByCaller(opts.signal) && attempt < MAX_TRANSPORT_RETRIES;
        if (!isRetryable) throw error;
        this.transportEvents.push({ attempt: attempt + 1, reason: describeFailure(error) });
        await Bun.sleep(RETRY_BACKOFF_MS * (attempt + 1));
      }
    }
  }

  private recordUsage(chunk: ProviderChunk): void {
    if (chunk.type !== "usage") return;
    this.ledger.record({
      model: this.model,
      inputTokens: chunk.inputTokens,
      outputTokens: chunk.outputTokens,
      cachedInputTokens: chunk.cachedInputTokens ?? 0,
      costUsd: costUsd(this.model, chunk),
    });
  }
}
