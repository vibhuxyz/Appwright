import { prisma } from "@repo/db";
import { sharedWorktreeWhere } from "../workspace/shared-worktree";

export const MAX_CONCURRENT_RUNS_PER_PROJECT = 3;

export const WORKTREE_BUSY_MESSAGE =
  "Another chat is still running on this code. Wait for it to finish or stop it first.";

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

export async function isWorktreeBusy(
  worktreeSessionId: string,
  excludeSessionId: string,
): Promise<boolean> {
  const activeRuns = await prisma.session.count({
    where: {
      ...sharedWorktreeWhere(worktreeSessionId),
      id: { not: excludeSessionId },
      status: { in: [...ACTIVE_STATUSES] },
    },
  });
  return activeRuns > 0;
}
