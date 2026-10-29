import { describe, expect, it } from "bun:test";
import type { ThemeOption } from "@repo/contracts";
import { UNKNOWN_DECISION, type Decision, type DecisionResult } from "@repo/decision-engine";
import { shouldRunBlueprintPath } from "../src/worker/should-run-blueprint";

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

const theme = {
  id: "soft-glow",
  name: "Soft Glow",
  tagline: "Gentle tinted surfaces",
  mood: "light",
  palette: {
    background: "#f9f1f0",
    foreground: "#2e1c1a",
    card: "#ffffff",
    primary: "#af5041",
    primaryForeground: "#ffffff",
    secondary: "#f3d9d4",
    secondaryForeground: "#2e1c1a",
    accent: "#ad4c70",
    accentForeground: "#ffffff",
    muted: "#f6e8e5",
    mutedForeground: "#6b4b46",
    border: "#ead5d0",
  },
  fonts: { heading: "Fraunces", body: "DM Sans" },
  radius: "lg",
} satisfies ThemeOption;

function classifierReturning(result: DecisionResult) {
  const calls: number[] = [];
  const classifyTurn = async (): Promise<DecisionResult> => {
    calls.push(calls.length);
    return result;
  };
  return { classifyTurn, calls };
}

const noSignals = { theme: undefined, approvedBlueprintId: undefined };

describe("shouldRunBlueprintPath", () => {
  it("always plans after the user picks a design system, without classifying", async () => {
    const { classifyTurn, calls } = classifierReturning({ status: "invalid", decision: UNKNOWN_DECISION });
    expect(
      await shouldRunBlueprintPath({ theme, approvedBlueprintId: undefined }, classifyTurn),
    ).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("runs an approved plan even when the classifier scores it as small", async () => {
    const { classifyTurn, calls } = classifierReturning(
      accepted({ intent: "create", complexity: 4, confidence: 0.9 }),
    );
    expect(
      await shouldRunBlueprintPath({ theme: undefined, approvedBlueprintId: "bp-1" }, classifyTurn),
    ).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("still skips a tiny style tweak when no theme or plan was chosen", async () => {
    const { classifyTurn, calls } = classifierReturning(accepted({}));
    expect(await shouldRunBlueprintPath(noSignals, classifyTurn)).toBe(false);
    expect(calls).toHaveLength(1);
  });

  it("plans a complex create with no theme", async () => {
    const { classifyTurn } = classifierReturning(
      accepted({ intent: "create", complexity: 8, confidence: 0.8 }),
    );
    expect(await shouldRunBlueprintPath(noSignals, classifyTurn)).toBe(true);
  });
});
