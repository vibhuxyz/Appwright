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

describe("shouldRunBlueprintPath", () => {
  it("always plans after the user picks a design system", () => {
    expect(shouldRunBlueprintPath(theme, accepted({}))).toBe(true);
    expect(
      shouldRunBlueprintPath(theme, { status: "invalid", decision: UNKNOWN_DECISION }),
    ).toBe(true);
  });

  it("still skips a tiny style tweak when no theme was chosen", () => {
    expect(shouldRunBlueprintPath(undefined, accepted({}))).toBe(false);
  });

  it("plans a complex create with no theme", () => {
    expect(
      shouldRunBlueprintPath(
        undefined,
        accepted({ intent: "create", complexity: 8, confidence: 0.8 }),
      ),
    ).toBe(true);
  });
});
