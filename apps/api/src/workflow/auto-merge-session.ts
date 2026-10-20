import { mergeSession } from "@repo/tools";
import {
  projectRepoPath,
  removeSessionWorktree,
  sessionServerKey,
  stopDevServer,
} from "../workspace/manager";

export interface AutoMergeResult {
  merged: boolean;
  conflict: boolean;
  message: string;
}

export async function autoMergeSession(
  projectId: string,
  sessionId: string,
): Promise<AutoMergeResult> {
  const repoDir = projectRepoPath(projectId);
  const branchName = `agent/${sessionId}`;
  const result = await mergeSession(repoDir, branchName);

  if (result.ok) {
    stopDevServer(sessionServerKey(sessionId));
    await removeSessionWorktree(projectId, sessionId);
  }

  return { merged: result.ok, conflict: result.conflict, message: result.message };
}
