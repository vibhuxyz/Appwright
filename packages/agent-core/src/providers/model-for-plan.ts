import { canUseModel, type PlanId } from "@repo/contracts";
import { bestAvailableModel, bestAvailableModels } from "./best-available-model";

export function modelAllowedForPlan(plan: PlanId): (modelId: string) => boolean {
  return (modelId) => canUseModel(plan, modelId);
}

export function bestModelForPlan(plan: PlanId): string {
  return bestAvailableModel(process.env, modelAllowedForPlan(plan));
}

export function plannerModel(plan: PlanId, env: NodeJS.Dict<string> = process.env): string {
  const configured = env.PLANNER_MODEL?.trim();
  return configured && configured.length > 0 ? configured : bestModelForPlan(plan);
}

export function bestModelsForPlan(plan: PlanId): string[] {
  return bestAvailableModels(process.env, modelAllowedForPlan(plan));
}

export function resolveModelForPlan(plan: PlanId, requestedModel: string): string {
  return canUseModel(plan, requestedModel) ? requestedModel : bestModelForPlan(plan);
}
