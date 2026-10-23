import { prisma } from "@repo/db";

const AGENT_WORK_TYPE = "toolCall";

export async function projectHasBuiltApp(projectId: string): Promise<boolean> {
  const [toolCalls, completedRuns, plans] = await Promise.all([
    prisma.message.count({ where: { type: AGENT_WORK_TYPE, session: { projectId } }, take: 1 }),
    prisma.run.count({ where: { status: "COMPLETED", session: { projectId } }, take: 1 }),
    prisma.blueprint.count({ where: { session: { projectId } }, take: 1 }),
  ]);
  return toolCalls > 0 || completedRuns > 0 || plans > 0;
}
