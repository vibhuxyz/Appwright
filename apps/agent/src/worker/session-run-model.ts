import { resolveRunModel, scaleBudget, type AutoProfile } from "@repo/agent-core";
import {
  parseEffortLevel,
  type EffortLevel,
  type PlanId,
  type PromptAnalysis,
} from "@repo/contracts";

type AnalysisSlice = Pick<PromptAnalysis, "complexity" | "intent" | "confidence">;

export function sessionEffort(value: string | undefined): EffortLevel {
  return parseEffortLevel(value);
}

export function runModelFor(input: {
  readonly sessionModel: string;
  readonly plan: PlanId;
  readonly profile: AutoProfile;
  readonly effort: EffortLevel;
  readonly analysis?: AnalysisSlice;
}): string {
  return resolveRunModel({
    sessionModel: input.sessionModel,
    plan: input.plan,
    profile: input.profile,
    effort: input.effort,
    ...(input.analysis
      ? {
          complexity: input.analysis.complexity,
          intent: input.analysis.intent,
          confidence: input.analysis.confidence,
        }
      : {}),
  });
}

export function autoRouteFields(analysis: AnalysisSlice | undefined, effort: EffortLevel) {
  return {
    effort,
    ...(analysis
      ? {
          complexity: analysis.complexity,
          intent: analysis.intent,
          confidence: analysis.confidence,
        }
      : {}),
  };
}

export function effortLoopBudget(
  spend: { maxTokens: number; maxCostUsd: number },
  maxIterations: number,
  effort: EffortLevel,
  creditUsd: number,
) {
  const scaled = scaleBudget({ maxCostUsd: spend.maxCostUsd, maxIterations }, effort);
  return {
    maxTokens: spend.maxTokens,
    maxCostUsd: Math.min(scaled.maxCostUsd, creditUsd),
    maxIterations: scaled.maxIterations,
  };
}
