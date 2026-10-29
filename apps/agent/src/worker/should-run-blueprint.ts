import type { ThemeOption } from "@repo/contracts";
import { needsDetailedPlan, type DecisionResult } from "@repo/decision-engine";

export interface PlanSignals {
  readonly theme: ThemeOption | undefined;
  readonly approvedBlueprintId: string | undefined;
}

export async function shouldRunBlueprintPath(
  signals: PlanSignals,
  classifyTurn: () => Promise<DecisionResult>,
): Promise<boolean> {
  if (signals.theme || signals.approvedBlueprintId) return true;
  return needsDetailedPlan(await classifyTurn());
}
