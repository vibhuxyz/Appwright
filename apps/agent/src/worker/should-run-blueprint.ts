import type { ThemeOption } from "@repo/contracts";
import { needsDetailedPlan, type DecisionResult } from "@repo/decision-engine";

export function shouldRunBlueprintPath(
  theme: ThemeOption | undefined,
  decision: DecisionResult,
): boolean {
  if (theme) return true;
  return needsDetailedPlan(decision);
}
