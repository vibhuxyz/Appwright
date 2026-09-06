import { providerFor } from "./openai";

// USD per 1M tokens. Deliberately a plain table and not an API lookup — no
// host publishes prices programmatically, so the only honest options are a
// table someone maintains or a number that is silently wrong.
interface Price {
  in: number;
  out: number;
}

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
};

export function priceFor(model: string): Price {
  return PRICES[model] ?? FALLBACKS[providerFor(model)] ?? FALLBACKS.openai!;
}

export function costUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = priceFor(model);
  return (inputTokens * price.in + outputTokens * price.out) / 1_000_000;
}
