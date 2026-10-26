import { prisma } from "@repo/db";

const MERGED_RUN_FILTER = { path: ["merge", "merged"], equals: true };

export async function projectHasBuiltApp(projectId: string): Promise<boolean> {
  const [mergedRuns, completedRuns] = await Promise.all([
    prisma.message.count({ where: { session: { projectId }, data: MERGED_RUN_FILTER }, take: 1 }),
    prisma.run.count({ where: { status: "COMPLETED", session: { projectId } }, take: 1 }),
  ]);
  return mergedRuns > 0 || completedRuns > 0;
}
