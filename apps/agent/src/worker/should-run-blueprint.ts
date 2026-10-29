import type { PromptAnalysis, ThemeOption } from "@repo/contracts";
import { analysisNeedsDetailedPlan, needsDetailedPlan, type DecisionResult } from "@repo/decision-engine";

export interface PlanSignals {
  readonly theme: ThemeOption | undefined;
  readonly approvedBlueprintId: string | undefined;
  readonly analysis: PromptAnalysis | undefined;
}

export async function shouldRunBlueprintPath(
  signals: PlanSignals,
  classifyTurn: () => Promise<DecisionResult>,
): Promise<boolean> {
  if (signals.theme || signals.approvedBlueprintId) return true;
  if (signals.analysis) return analysisNeedsDetailedPlan(signals.analysis);
  return needsDetailedPlan(await classifyTurn());
}
