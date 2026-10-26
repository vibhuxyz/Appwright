import { commitTurn } from "@repo/tools";
import { log } from "../log";
import { sessionWorktreePath } from "../workspace/manager";

export async function commitSessionCheckpoint(
  projectId: string,
  worktreeSessionId: string,
  prompt: string,
): Promise<void> {
  const worktreeDir = sessionWorktreePath(projectId, worktreeSessionId);
  const result = await commitTurn(worktreeDir, prompt);
  if (result.kind === "failed") {
    log.warn("asset checkpoint commit failed", { projectId, worktreeSessionId, message: result.message });
  }
}
