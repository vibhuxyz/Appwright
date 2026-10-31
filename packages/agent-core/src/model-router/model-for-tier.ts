import type { ModelCategory, PlanId } from "@repo/contracts";
import { bestAvailableModelForCategory } from "../providers/best-available-model";
import { DEFAULT_MODEL } from "../providers/openai";
import { modelAllowedForPlan } from "../providers/model-for-plan";

const FALLBACK: Record<ModelCategory, readonly ModelCategory[]> = {
  frontier: ["frontier", "standard", "efficient"],
  standard: ["standard", "frontier", "efficient"],
  efficient: ["efficient", "standard", "frontier"],
};

export function modelForTier(
  tier: ModelCategory,
  plan: PlanId,
  env: NodeJS.Dict<string> = process.env,
): string {
  const isAllowed = modelAllowedForPlan(plan);
  for (const category of FALLBACK[tier]) {
    const id = bestAvailableModelForCategory(category, env, isAllowed);
    if (id) return id;
  }
  return DEFAULT_MODEL;
}
