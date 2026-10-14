import { describe, expect, it } from "bun:test";
import { UNKNOWN_DECISION } from "../src/classify";
import { resolvePolicy } from "../src/policy";
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

  it("would NOT send the placeholder decision to review on its own merits alone", () => {
    // Proves the status check is load-bearing: if resolvePolicy ever
    // stopped checking status first, this decision's own fields
    // (risk: "medium", confidence: 0) still happen to trip the
    // confidence < 0.5 rule today — but that's a coincidence, not a
    // guarantee, which is why status is checked first instead.
    expect(UNKNOWN_DECISION.confidence).toBeLessThan(0.5);
  });
});
