import { describe, expect, it } from "bun:test";
import { AUTO_MODEL_ID } from "@repo/contracts";
import { resolveRunModel, scaleBudget, selectModel, specialistModel, tierFor } from "../src/model-router";

const KEYS = { GEMINI_API_KEY: "x", OPENAI_API_KEY: "x", ANTHROPIC_API_KEY: "x", DEEPSEEK_API_KEY: "x" };

describe("tierFor", () => {
  it("sends testing and handoff to efficient", () => {
    expect(tierFor({ mode: "auto", profile: "testing", plan: "MAX" })).toBe("efficient");
    expect(tierFor({ mode: "auto", profile: "handoff", plan: "MAX" })).toBe("efficient");
  });

  it("sends auth and integration to frontier", () => {
    expect(tierFor({ mode: "auto", profile: "auth", plan: "MAX" })).toBe("frontier");
    expect(tierFor({ mode: "auto", profile: "integration", plan: "MAX" })).toBe("frontier");
  });

  it("sends high complexity and low confidence to frontier", () => {
    expect(tierFor({ mode: "auto", profile: "coding", plan: "MAX", complexity: 7 })).toBe("frontier");
    expect(tierFor({ mode: "auto", profile: "coding", plan: "MAX", confidence: 0.4 })).toBe("frontier");
  });

  it("sends UI work to standard unless it is hard", () => {
    expect(tierFor({ mode: "auto", profile: "ui", plan: "MAX" })).toBe("standard");
    expect(tierFor({ mode: "auto", profile: "ui", plan: "MAX", complexity: 5 })).toBe("frontier");
  });

  it("sends chat to efficient", () => {
    expect(tierFor({ mode: "auto", profile: "coding", plan: "MAX", intent: "chat" })).toBe("efficient");
  });

  it("applies effort without promoting testing off efficient", () => {
    expect(tierFor({ mode: "auto", profile: "coding", plan: "MAX", effort: "low" })).toBe("efficient");
    expect(tierFor({ mode: "auto", profile: "ui", plan: "MAX", effort: "high" })).toBe("frontier");
    expect(tierFor({ mode: "auto", profile: "testing", plan: "MAX", effort: "high" })).toBe("efficient");
    expect(tierFor({ mode: "auto", profile: "auth", plan: "MAX", effort: "low" })).toBe("standard");
  });
});

describe("selectModel", () => {
  it("returns the manual model when Auto is off", () => {
    expect(
      selectModel({ mode: "manual", manualModel: "claude-haiku-5-5", profile: "auth", plan: "MAX", env: KEYS }),
    ).toBe("claude-haiku-5-5");
  });

  it("picks a reachable tier model when Auto is on", () => {
    expect(selectModel({ mode: "auto", profile: "testing", plan: "MAX", env: KEYS })).toBe("gemini-3.7-flash");
    expect(selectModel({ mode: "auto", profile: "ui", plan: "MAX", env: KEYS })).toBe("gemini-3.1-pro-preview");
    expect(selectModel({ mode: "auto", profile: "auth", plan: "MAX", env: KEYS })).toBe("gpt-5.4");
  });

  it("stays inside the plan when Auto wants a higher tier", () => {
    expect(selectModel({ mode: "auto", profile: "auth", plan: "FREE", env: KEYS })).toBe("gemini-3.7-flash");
  });
});

describe("resolveRunModel", () => {
  it("keeps a concrete session model and routes Auto", () => {
    expect(resolveRunModel({ sessionModel: "claude-haiku-5-5", plan: "MAX", profile: "auth", env: KEYS })).toBe(
      "claude-haiku-5-5",
    );
    expect(resolveRunModel({ sessionModel: AUTO_MODEL_ID, plan: "MAX", profile: "testing", env: KEYS })).toBe(
      "gemini-3.7-flash",
    );
  });
});

describe("specialistModel", () => {
  it("uses the env override when set", () => {
    expect(
      specialistModel({
        envKey: "TESTING_AGENT_MODEL",
        sessionModel: AUTO_MODEL_ID,
        profile: "testing",
        plan: "MAX",
        env: { ...KEYS, TESTING_AGENT_MODEL: "gpt-4o-mini" },
      }),
    ).toBe("gpt-4o-mini");
  });
});

describe("scaleBudget", () => {
  it("tightens low effort and raises high effort", () => {
    const base = { maxCostUsd: 2, maxIterations: 60 };
    expect(scaleBudget(base, "low")).toEqual({ maxCostUsd: 1, maxIterations: 36 });
    expect(scaleBudget(base, "high")).toEqual({ maxCostUsd: 3, maxIterations: 75 });
    expect(scaleBudget(base, "medium")).toEqual(base);
  });
});
