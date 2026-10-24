import type { Prisma } from "@repo/db";
import { sessionBranchName } from "@repo/workspace";

export function sharedWorktreeWhere(
  worktreeSessionId: string,
): Prisma.SessionWhereInput {
  return {
    OR: [
      { id: worktreeSessionId },
      { branch: sessionBranchName(worktreeSessionId) },
    ],
  };
}
