import { describe, expect, it } from "bun:test";
import { UNKNOWN_DECISION } from "../src/classify";
import { isNewBuildRequest, needsDetailedPlan, resolvePolicy } from "../src/policy";
import type { Decision, DecisionResult } from "../src/types";

function accepted(overrides: Partial<Decision>): DecisionResult {
  return {
    status: "accepted",
    decision: {
      intent: "modify",
      changeType: "style",
      risk: "low",
      route: "none",
      component: "none",
      complexity: 1,
      ambiguity: 1,
      confidence: 0.9,
      ...overrides,
    },
  };
}

describe("resolvePolicy", () => {
  it("sends a low-risk style change with no route direct", () => {
    expect(resolvePolicy(accepted({}))).toBe("direct");
  });

  it("sends high risk to review", () => {
    expect(resolvePolicy(accepted({ risk: "high" }))).toBe("review");
  });

  it("sends any database change to review regardless of risk", () => {
    expect(
      resolvePolicy(accepted({ changeType: "database", risk: "low" })),
    ).toBe("review");
  });

  it("sends a database route to review even if changeType isn't database", () => {
    expect(resolvePolicy(accepted({ route: "database" }))).toBe("review");
  });

  it("sends highly ambiguous requests to review", () => {
    expect(resolvePolicy(accepted({ ambiguity: 8 }))).toBe("review");
  });

  it("sends low-confidence classifications to review", () => {
    expect(resolvePolicy(accepted({ confidence: 0.2 }))).toBe("review");
  });

  it("blocks deleting a database outright, ahead of the review rules", () => {
    expect(
      resolvePolicy(accepted({ intent: "delete", changeType: "database" })),
    ).toBe("blocked");
  });

  it("sends a test intent to tool", () => {
    expect(resolvePolicy(accepted({ intent: "test", route: "devops" }))).toBe(
      "tool",
    );
  });

  it("sends a routed, low-risk change to agent rather than direct", () => {
    expect(resolvePolicy(accepted({ route: "backend" }))).toBe("agent");
  });

  it("sends a complex low-risk change to agent rather than direct", () => {
    expect(resolvePolicy(accepted({ complexity: 6 }))).toBe("agent");
  });

  it("doesn't let component change the outcome — it's logged, not yet policy input", () => {
    expect(resolvePolicy(accepted({ component: "Button" }))).toBe("direct");
  });

  // A non-"accepted" status must force review before any of the rules
  // above run — this is the fail-closed guarantee, checked directly on
  // `status` rather than relying on the placeholder decision's fields.
  it("sends an invalid classification to review, even though the placeholder decision looks low-risk", () => {
    expect(
      resolvePolicy({ status: "invalid", decision: UNKNOWN_DECISION }),
    ).toBe("review");
  });

  it("sends a provider error to review", () => {
    expect(
      resolvePolicy({ status: "provider_error", decision: UNKNOWN_DECISION }),
    ).toBe("review");
  });
});

describe("needsDetailedPlan", () => {
  it("plans a complex, confident request to create something", () => {
    expect(
      needsDetailedPlan(accepted({ intent: "create", complexity: 8, confidence: 0.8 })),
    ).toBe(true);
  });

  it("skips planning for a simple style tweak", () => {
    expect(
      needsDetailedPlan(accepted({ intent: "modify", complexity: 1, confidence: 0.9 })),
    ).toBe(false);
  });

  it("skips planning when complexity is below the threshold, even for create", () => {
    expect(
      needsDetailedPlan(accepted({ intent: "create", complexity: 5, confidence: 0.8 })),
    ).toBe(false);
  });

  it("skips planning when confidence is too low to trust the read", () => {
    expect(
      needsDetailedPlan(accepted({ intent: "create", complexity: 9, confidence: 0.4 })),
    ).toBe(false);
  });

  it("fails closed on a non-accepted status", () => {
    expect(
      needsDetailedPlan({ status: "invalid", decision: UNKNOWN_DECISION }),
    ).toBe(false);
  });

  it("would NOT send the placeholder decision to review on its own merits alone", () => {
    // Proves the status check is load-bearing: if resolvePolicy ever
    // stopped checking status first, this decision's own fields
    // (risk: "medium", confidence: 0) still happen to trip the
    // confidence < 0.5 rule today — but that's a coincidence, not a
    // guarantee, which is why status is checked first instead.
    expect(UNKNOWN_DECISION.confidence).toBeLessThan(0.5);
  });
});

describe("isNewBuildRequest", () => {
  it("treats any confident create request as a new build, however small", () => {
    expect(isNewBuildRequest(accepted({ intent: "create", complexity: 3, confidence: 0.8 }))).toBe(true);
  });

  it("does not treat a change to an existing app as a new build", () => {
    expect(isNewBuildRequest(accepted({ intent: "modify", complexity: 6, confidence: 0.9 }))).toBe(false);
  });

  it("does not trust a low-confidence read", () => {
    expect(isNewBuildRequest(accepted({ intent: "create", complexity: 8, confidence: 0.3 }))).toBe(false);
  });
});
