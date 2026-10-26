import { providerFor } from "./openai";
import type { TokenUsage } from "./types";

// USD per 1M tokens. Deliberately a plain table and not an API lookup — no
// host publishes prices programmatically, so the only honest options are a
// table someone maintains or a number that is silently wrong.
interface Price {
  in: number;
  out: number;
  cachedIn?: number;
}

const TOKENS_PER_PRICE_UNIT = 1_000_000;

const PRICES: Record<string, Price> = {
  "gpt-5.4": { in: 1.25, out: 10 },
  "gpt-5.4-mini": { in: 0.25, out: 2 },
  "gpt-5.2-codex": { in: 1.25, out: 10 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "openai/gpt-oss-120b": { in: 0.15, out: 0.75 },
  "openai/gpt-oss-20b": { in: 0.1, out: 0.5 },
  "llama-3.3-70b-versatile": { in: 0.59, out: 0.79 },
  "llama-3.1-8b-instant": { in: 0.05, out: 0.08 },
  "qwen/qwen3.6-27b": { in: 0.29, out: 0.59 },
  "gemini-3.7-flash": { in: 0.3, out: 2.5 },
  "gemini-3.1-pro-preview": { in: 1.25, out: 10 },
  "gemini-flash-latest": { in: 0.3, out: 2.5 },
  "claude-sonnet-5-5": { in: 2, out: 10 },
  "claude-opus-5-5": { in: 4, out: 20 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5 },
  "deepseek-chat": { in: 0.28, out: 0.42 },
  "deepseek-reasoner": { in: 0.28, out: 0.42 },
  "deepseek-flash": { in: 0.3, out: 1.2, cachedIn: 0.006 },
  "deepseek-v4-pro": { in: 0.66, out: 1.98, cachedIn: 0.044 },
};

// An unpriced model must not read as free. A run that costs nothing can
// never trip maxCostUsd, so the budget silently stops existing for exactly
// the models nobody remembered to add. Fall back to the most expensive
// price in the model's own family instead: the number is wrong, but it is
// wrong in the direction that still stops a runaway loop.
const FALLBACKS: Record<string, Price> = {
  openai: { in: 1.25, out: 10 },
  gemini: { in: 1.25, out: 10 },
  groq: { in: 0.59, out: 0.79 },
  xai: { in: 3, out: 15 },
  anthropic: { in: 4, out: 20 },
  deepseek: { in: 0.3, out: 1.2 },
};

export function priceFor(model: string): Price {
  return PRICES[model] ?? FALLBACKS[providerFor(model)] ?? FALLBACKS.openai!;
}

export function costUsd(model: string, usage: TokenUsage): number {
  const price = priceFor(model);
  const cachedTokens = Math.min(Math.max(usage.cachedInputTokens ?? 0, 0), usage.inputTokens);
  const cachedPrice = price.cachedIn ?? price.in;
  const uncachedTokens = usage.inputTokens - cachedTokens;
  const total = uncachedTokens * price.in + cachedTokens * cachedPrice + usage.outputTokens * price.out;
  return total / TOKENS_PER_PRICE_UNIT;
}
