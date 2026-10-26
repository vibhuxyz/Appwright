import { z } from "zod";
import { modelCategory } from "../models.catalog";
import type { ModelCategory } from "../session.schema";

export const PLAN_IDS = ["FREE", "PRO", "MAX"] as const;
export const PlanIdSchema = z.enum(PLAN_IDS);
export type PlanId = z.infer<typeof PlanIdSchema>;

export const PLAN_MODEL_CATEGORIES = {
  FREE: ["efficient"],
  PRO: ["efficient", "standard"],
  MAX: ["efficient", "standard", "frontier"],
} as const satisfies Record<PlanId, readonly ModelCategory[]>;

export const PLAN_CREDIT_OPTIONS_USD = {
  FREE: [],
  PRO: [50, 75, 100],
  MAX: [150, 300, 450],
} as const satisfies Record<PlanId, readonly number[]>;

export const PaidPlanIdSchema = z.enum(["PRO", "MAX"]);
export type PaidPlanId = z.infer<typeof PaidPlanIdSchema>;

export const UpgradePlanRequest = z
  .object({ plan: PaidPlanIdSchema, creditsUsd: z.number().int().positive() })
  .refine(
    ({ plan, creditsUsd }) => (PLAN_CREDIT_OPTIONS_USD[plan] as readonly number[]).includes(creditsUsd),
    { message: "creditsUsd is not an option for this plan", path: ["creditsUsd"] },
  );
export type UpgradePlanRequest = z.infer<typeof UpgradePlanRequest>;

export function canUseModel(plan: PlanId, modelId: string): boolean {
  const categories: readonly ModelCategory[] = PLAN_MODEL_CATEGORIES[plan];
  return categories.includes(modelCategory({ id: modelId }));
}

export function requiredPlanFor(modelId: string): PlanId {
  return PLAN_IDS.find((plan) => canUseModel(plan, modelId)) ?? "MAX";
}

export function canAccessCodebase(plan: PlanId): boolean {
  return plan !== "FREE";
}
