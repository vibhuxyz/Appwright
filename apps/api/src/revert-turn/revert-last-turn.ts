import type { RevertedTurn } from "@repo/contracts";
import { revertTurn } from "@repo/tools";
import { sessionBranchName } from "@repo/workspace";
import { projectRepoPath, sessionWorktreePath } from "../workspace/manager";
import { findRevertTarget } from "./find-target";
import { recordRevertMarker } from "./record-marker";

export type RevertLastTurnResult =
  | { readonly ok: true; readonly revertedTurn: RevertedTurn }
  | { readonly ok: false; readonly status: 409 | 500; readonly code: string; readonly message: string };

const REASON_STATUS = { dirty: 409, "not-on-branch": 409, conflict: 409, failed: 500 } as const;

export async function revertLastTurn(projectId: string, worktreeSessionId: string): Promise<RevertLastTurnResult> {
  const lookup = await findRevertTarget(projectId, worktreeSessionId);
  if (lookup.kind === "run-active") {
    return { ok: false, status: 409, code: "RUN_ACTIVE", message: "A run is still working in this chat. Stop it or wait, then revert." };
  }
  if (lookup.kind === "nothing-to-revert") {
    return { ok: false, status: 409, code: "NOTHING_TO_REVERT", message: "There is no saved agent turn to undo in this chat. Nothing was changed." };
  }
  const result = await revertTurn({
    worktreeDir: sessionWorktreePath(projectId, worktreeSessionId),
    repoDir: projectRepoPath(projectId),
    branchName: sessionBranchName(worktreeSessionId),
    sha: lookup.target.sha,
  });
  if (!result.ok) {
    return { ok: false, status: REASON_STATUS[result.reason], code: result.reason.toUpperCase().replaceAll("-", "_"), message: result.message };
  }
  const revertedTurn = await recordRevertMarker(lookup.target, {
    revertSha: result.revertSha,
    mainUpdated: result.main.kind === "updated",
    ...(result.main.kind === "failed" ? { mainError: result.main.message } : {}),
  });
  return { ok: true, revertedTurn };
}
