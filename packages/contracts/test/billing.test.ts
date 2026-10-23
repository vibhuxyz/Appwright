import { describe, expect, it } from "bun:test";
import {
  AGENT_LOOP_LIMITS,
  AVAILABLE_MODELS,
  UpgradePlanRequest,
  canUseModel,
  creditsToCents,
  creditsToUsd,
  loopSpendLimits,
  requiredPlanFor,
  usdToCredits,
} from "../src";

describe("credits", () => {
  it("converts dollars and credits both ways", () => {
    expect(usdToCredits(10)).toBe(10_000_000);
    expect(creditsToUsd(243_536_591)).toBeCloseTo(243.54, 2);
    expect(creditsToCents(243_536_591)).toBe(24_353);
  });

  it("never reports a negative balance", () => {
    expect(creditsToUsd(-5)).toBe(0);
    expect(creditsToCents(-5)).toBe(0);
  });

  it("rounds a partial credit up so spend is never under-charged", () => {
    expect(usdToCredits(0.0000015)).toBe(2);
  });
});

describe("loopSpendLimits", () => {
  it("caps cost at the per-run ceiling when the balance is large", () => {
    expect(loopSpendLimits(243_536_591)).toEqual({
      maxTokens: AGENT_LOOP_LIMITS.maxTokens,
      maxCostUsd: AGENT_LOOP_LIMITS.maxCostUsd,
    });
  });

  it("caps cost at the balance when the balance is small", () => {
    expect(loopSpendLimits(1_500_000).maxCostUsd).toBe(1.5);
  });

  it("does not tie the token ceiling to the balance", () => {
    expect(loopSpendLimits(10).maxTokens).toBe(AGENT_LOOP_LIMITS.maxTokens);
  });
});

describe("plan model access", () => {
  it("gives FREE only efficient models", () => {
    expect(canUseModel("FREE", "claude-haiku-5-5")).toBe(true);
    expect(canUseModel("FREE", "claude-sonnet-5-5")).toBe(false);
    expect(canUseModel("FREE", "deepseek-reasoner")).toBe(false);
  });

  it("gives PRO efficient and standard models", () => {
    expect(canUseModel("PRO", "claude-sonnet-5-5")).toBe(true);
    expect(canUseModel("PRO", "claude-opus-5-5")).toBe(false);
  });

  it("gives MAX every catalog model", () => {
    expect(AVAILABLE_MODELS.every((model) => canUseModel("MAX", model.id))).toBe(true);
  });

  it("names the cheapest plan that unlocks a model", () => {
    expect(requiredPlanFor("gpt-4o-mini")).toBe("FREE");
    expect(requiredPlanFor("claude-sonnet-5-5")).toBe("PRO");
    expect(requiredPlanFor("claude-opus-5-5")).toBe("MAX");
  });
});

describe("UpgradePlanRequest", () => {
  it("accepts a listed credit option for the plan", () => {
    expect(UpgradePlanRequest.safeParse({ plan: "PRO", creditsUsd: 75 }).success).toBe(true);
    expect(UpgradePlanRequest.safeParse({ plan: "MAX", creditsUsd: 450 }).success).toBe(true);
  });

  it("rejects an amount that is not an option for the plan", () => {
    expect(UpgradePlanRequest.safeParse({ plan: "PRO", creditsUsd: 450 }).success).toBe(false);
    expect(UpgradePlanRequest.safeParse({ plan: "FREE", creditsUsd: 0 }).success).toBe(false);
  });
});
