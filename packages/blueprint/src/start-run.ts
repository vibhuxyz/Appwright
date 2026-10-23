import { prisma } from "@repo/db";

export interface StartBlueprintRunInput {
  sessionId: string;
  blueprintVersion: number;
  budgetUsd: number;
}

export async function startBlueprintRun(input: StartBlueprintRunInput): Promise<string> {
  const run = await prisma.run.create({
    data: {
      sessionId: input.sessionId,
      blueprintVersion: input.blueprintVersion,
      trigger: "INITIAL",
      status: "QUEUED",
      budgetUsd: input.budgetUsd,
    },
    select: { id: true },
  });
  return run.id;
}
