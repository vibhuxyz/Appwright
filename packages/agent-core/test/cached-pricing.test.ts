import { describe, expect, test } from "bun:test";
import { cachedPromptTokens } from "../src/providers/cached-prompt-tokens";
import { costUsd } from "../src/providers/pricing";

const MILLION = 1_000_000;

describe("cached input pricing", () => {
  test("deepseek-flash bills cache hits at the documented cache price", () => {
    const allMiss = costUsd("deepseek-flash", { inputTokens: MILLION, outputTokens: 0 });
    const allHit = costUsd("deepseek-flash", { inputTokens: MILLION, outputTokens: 0, cachedInputTokens: MILLION });
    expect(allMiss).toBeCloseTo(0.3, 6);
    expect(allHit).toBeCloseTo(0.006, 6);
  });

  test("a mixed turn splits hits and misses", () => {
    const cost = costUsd("deepseek-flash", { inputTokens: MILLION, outputTokens: MILLION, cachedInputTokens: 900_000 });
    expect(cost).toBeCloseTo(0.1 * 0.3 + 0.9 * 0.006 + 1.2, 6);
  });

  test("a model with no published cache price still bills cached tokens at full input price", () => {
    const withCache = costUsd("gpt-5.4-mini", { inputTokens: MILLION, outputTokens: 0, cachedInputTokens: MILLION });
    expect(withCache).toBeCloseTo(0.25, 6);
  });

  test("a cached count larger than the input, or negative, cannot lower the bill below the real input", () => {
    expect(costUsd("deepseek-flash", { inputTokens: 1000, outputTokens: 0, cachedInputTokens: 5000 }))
      .toBeCloseTo((1000 * 0.006) / MILLION, 12);
    expect(costUsd("deepseek-flash", { inputTokens: 1000, outputTokens: 0, cachedInputTokens: -5 }))
      .toBeCloseTo((1000 * 0.3) / MILLION, 12);
  });
});

describe("cachedPromptTokens", () => {
  test("reads DeepSeek's prompt_cache_hit_tokens first", () => {
    expect(cachedPromptTokens({ prompt_tokens: 100, prompt_cache_hit_tokens: 80, prompt_tokens_details: { cached_tokens: 10 } })).toBe(80);
  });

  test("falls back to the OpenAI-style cached_tokens", () => {
    expect(cachedPromptTokens({ prompt_tokens: 100, prompt_tokens_details: { cached_tokens: 64 } })).toBe(64);
  });

  test("is zero when absent or malformed", () => {
    expect(cachedPromptTokens({ prompt_tokens: 100 })).toBe(0);
    expect(cachedPromptTokens({ prompt_cache_hit_tokens: "lots" })).toBe(0);
    expect(cachedPromptTokens(null)).toBe(0);
  });
});
