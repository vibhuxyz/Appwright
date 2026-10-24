import { prisma } from "@repo/db";
import { sessionBranchName } from "@repo/workspace";
import { createSessionWorktree } from "./manager";

// D18 — opening a project costs nothing; only sending a message boots a
// sandbox. createSessionWorktree is a pure filesystem/git primitive with no
// DB dependency (tests call it directly against a throwaway sessionId); this
// wrapper is the one place that also persists branch/worktreePath onto a
// real session row, for callers that have one.
export async function ensureSessionWorktree(
  projectId: string,
  sessionId: string,
  worktreeSessionId: string,
): Promise<string> {
  const worktreePath = await createSessionWorktree(projectId, worktreeSessionId);
  await prisma.session.update({
    where: { id: sessionId },
    data: { branch: sessionBranchName(worktreeSessionId), worktreePath },
  });
  return worktreePath;
}
