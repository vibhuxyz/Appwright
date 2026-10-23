import { PLAN_IDS, usdToCredits, type PaidPlanId, type PlanId } from "@repo/contracts";
import { prisma } from "@repo/db";

export interface UpgradePlanInput {
  userId: string;
  plan: PaidPlanId;
  creditsUsd: number;
}

export type UpgradePlanResult =
  | { ok: true; plan: PlanId; credits: number }
  | { ok: false; code: "USER_NOT_FOUND" | "PLAN_DOWNGRADE" };

function isDowngrade(current: PlanId, next: PlanId): boolean {
  return PLAN_IDS.indexOf(next) < PLAN_IDS.indexOf(current);
}

export async function upgradePlan(input: UpgradePlanInput): Promise<UpgradePlanResult> {
  const current = await prisma.user.findUnique({ where: { id: input.userId }, select: { plan: true } });
  if (!current) return { ok: false, code: "USER_NOT_FOUND" };
  if (isDowngrade(current.plan, input.plan)) return { ok: false, code: "PLAN_DOWNGRADE" };
  const updated = await prisma.user.update({
    where: { id: input.userId },
    data: { plan: input.plan, credits: { increment: usdToCredits(input.creditsUsd) } },
    select: { plan: true, credits: true },
  });
  return { ok: true, plan: updated.plan, credits: updated.credits };
}
