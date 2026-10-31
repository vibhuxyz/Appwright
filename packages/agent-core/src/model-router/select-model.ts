import { isAutoModel } from "@repo/contracts";
import { resolveModelForPlan } from "../providers/model-for-plan";
import { modelForTier } from "./model-for-tier";
import { tierFor } from "./tier";
import type { ResolveRunModelInput, SelectModelInput } from "./types";

export function selectModel(input: SelectModelInput): string {
  if (input.mode === "manual" && input.manualModel && !isAutoModel(input.manualModel)) {
    return resolveModelForPlan(input.plan, input.manualModel);
  }
  return modelForTier(tierFor(input), input.plan, input.env);
}

export function resolveRunModel(input: ResolveRunModelInput): string {
  if (!isAutoModel(input.sessionModel)) {
    return resolveModelForPlan(input.plan, input.sessionModel);
  }
  return selectModel({
    mode: "auto",
    profile: input.profile,
    plan: input.plan,
    ...(input.complexity !== undefined ? { complexity: input.complexity } : {}),
    ...(input.intent !== undefined ? { intent: input.intent } : {}),
    ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
    ...(input.effort !== undefined ? { effort: input.effort } : {}),
    ...(input.env !== undefined ? { env: input.env } : {}),
  });
}

export function specialistModel(input: {
  readonly envKey: string;
  readonly sessionModel: string;
  readonly profile: "testing" | "handoff";
  readonly plan: ResolveRunModelInput["plan"];
  readonly effort?: ResolveRunModelInput["effort"];
  readonly env?: NodeJS.Dict<string>;
}): string {
  const env = input.env ?? process.env;
  const configured = env[input.envKey]?.trim();
  if (configured && configured.length > 0) return configured;
  return resolveRunModel({
    sessionModel: input.sessionModel,
    plan: input.plan,
    profile: input.profile,
    ...(input.effort !== undefined ? { effort: input.effort } : {}),
    env,
  });
}
