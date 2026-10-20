import { prisma } from "@repo/db";

const DEFAULT_RUN_BUDGET_USD = 5;

export async function startBlueprintRun(sessionId: string, blueprintVersion: number): Promise<string> {
  const run = await prisma.run.create({
    data: {
      sessionId,
      blueprintVersion,
      trigger: "INITIAL",
      status: "QUEUED",
      budgetUsd: DEFAULT_RUN_BUDGET_USD,
    },
    select: { id: true },
  });
  return run.id;
}
