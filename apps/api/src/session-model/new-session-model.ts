import { DEFAULT_MODEL, ENDPOINTS, providerFor, resolveModelForPlan } from "@repo/agent-core";
import { canUseModel, type PlanId } from "@repo/contracts";
import { prisma } from "@repo/db";
import { resolveNewSessionModel } from "./resolve";

function isModelConfigured(model: string): boolean {
  const key = process.env[ENDPOINTS[providerFor(model)].envKey];
  return typeof key === "string" && key.length > 0;
}

function isUsableOnPlan(plan: PlanId): (model: string) => boolean {
  return (model) => isModelConfigured(model) && canUseModel(plan, model);
}

export async function modelForNewSession(userId: string): Promise<string> {
  const [latest, user] = await Promise.all([
    prisma.session.findFirst({
      where: { project: { userId } },
      orderBy: { updatedAt: "desc" },
      select: { model: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
  ]);
  const plan = user?.plan ?? "FREE";
  const model = resolveNewSessionModel({
    lastUsedModel: latest?.model ?? null,
    defaultModel: DEFAULT_MODEL,
    isConfigured: isUsableOnPlan(plan),
  });
  return resolveModelForPlan(plan, model);
}
