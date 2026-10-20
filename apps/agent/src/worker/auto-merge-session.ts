import { mergeSession } from "@repo/tools";
import { projectRepoPath } from "@repo/workspace";

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
  return { merged: result.ok, conflict: result.conflict, message: result.message };
}
