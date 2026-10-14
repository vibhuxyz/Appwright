import { $ } from "bun";
import { sessionWorktreePath } from "../workspace/manager";

export async function commitSessionCheckpoint(
  projectId: string,
  sessionId: string,
  prompt: string,
): Promise<void> {
  const worktreeDir = sessionWorktreePath(projectId, sessionId);
  const firstLine = (prompt.split("\n")[0] ?? "").trim().slice(0, 60);
  await $`git -C ${worktreeDir} add .`.quiet().catch(() => {});
  await $`git -C ${worktreeDir} commit -m ${`agent: ${firstLine}`}`.quiet().catch(() => {});
}
