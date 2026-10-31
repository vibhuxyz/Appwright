import { describe, expect, it } from "bun:test";
import { autoRouteFields, effortLoopBudget, runModelFor, sessionEffort } from "../src/worker/session-run-model";

describe("sessionEffort", () => {
  it("defaults unknown values to medium", () => {
    expect(sessionEffort(undefined)).toBe("medium");
    expect(sessionEffort("high")).toBe("high");
  });
});

describe("runModelFor", () => {
  it("keeps a manual model", () => {
    expect(
      runModelFor({
        sessionModel: "claude-haiku-5-5",
        plan: "MAX",
        profile: "auth",
        effort: "high",
      }),
    ).toBe("claude-haiku-5-5");
  });
});

describe("autoRouteFields", () => {
  it("includes analysis when present", () => {
    expect(autoRouteFields(undefined, "low")).toEqual({ effort: "low" });
    expect(
      autoRouteFields({ complexity: 8, intent: "create", confidence: 0.9 }, "medium"),
    ).toEqual({ effort: "medium", complexity: 8, intent: "create", confidence: 0.9 });
  });
});

describe("effortLoopBudget", () => {
  it("does not spend more than remaining credits", () => {
    const budget = effortLoopBudget({ maxTokens: 100, maxCostUsd: 5 }, 60, "high", 2);
    expect(budget.maxCostUsd).toBe(2);
    expect(budget.maxIterations).toBe(75);
  });
});
