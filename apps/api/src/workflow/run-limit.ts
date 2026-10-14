import { prisma } from "@repo/db";

export const MAX_CONCURRENT_RUNS_PER_PROJECT = 3;

const ACTIVE_STATUSES = ["RUNNING", "AWAITING_APPROVAL"] as const;

export async function hasRunCapacity(
  projectId: string,
  excludeSessionId: string,
): Promise<boolean> {
  const activeRuns = await prisma.session.count({
    where: {
      projectId,
      id: { not: excludeSessionId },
      status: { in: [...ACTIVE_STATUSES] },
    },
  });
  return activeRuns < MAX_CONCURRENT_RUNS_PER_PROJECT;
}
