import { Router, type Request } from "express";
import {
  detectConflicts,
  diffSession,
  mergeSession,
  resolveConflicts,
  ResolveConflictsRequest,
} from "@repo/tools";
import { sessionBranchName } from "@repo/workspace";
import { ownedSessionWorktree } from "../ownership";
import { revertLastTurn } from "../revert-turn";
import {
  projectRepoPath,
  removeSessionWorktree,
  sessionServerKey,
  stopDevServer,
} from "../workspace/manager";

export const gitRouter = Router();

function requestIdOf(res: { getHeader(name: string): unknown }): string {
  const value = res.getHeader("x-request-id");
  return typeof value === "string" ? value : "";
}

gitRouter.get("/session/:id/diff", async (req, res) => {
  const owned = await ownedSessionWorktree(req.params.id, req.userId!);
  if (!owned) {
    return res.status(404).json({ error: "not found" });
  }

  const repoDir = projectRepoPath(owned.projectId);
  const branchName = sessionBranchName(owned.worktreeSessionId);
  const diffs = await diffSession(repoDir, branchName);
  res.json(diffs);
});

gitRouter.post("/session/:id/merge", async (req, res) => {
  const owned = await ownedSessionWorktree(req.params.id, req.userId!);
  if (!owned) {
    return res.status(404).json({ error: "not found" });
  }

  const repoDir = projectRepoPath(owned.projectId);
  const branchName = sessionBranchName(owned.worktreeSessionId);
  const result = await mergeSession(repoDir, branchName);

  if (result.ok) {
    stopDevServer(sessionServerKey(owned.worktreeSessionId));
    await removeSessionWorktree(owned.projectId, owned.worktreeSessionId);
  }

  res.json(result);
});

gitRouter.get("/session/:id/conflicts", async (req, res) => {
  const owned = await ownedSessionWorktree(req.params.id, req.userId!);
  if (!owned) {
    return res.status(404).json({ error: "not found" });
  }

  const report = await detectConflicts(
    projectRepoPath(owned.projectId),
    sessionBranchName(owned.worktreeSessionId),
  );
  res.json(report);
});

gitRouter.post("/session/:id/merge/resolve", async (req, res) => {
  const body = ResolveConflictsRequest.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: body.error.message });
  }
  const owned = await ownedSessionWorktree(req.params.id, req.userId!);
  if (!owned) {
    return res.status(404).json({ error: "not found" });
  }

  const result = await resolveConflicts(
    projectRepoPath(owned.projectId),
    sessionBranchName(owned.worktreeSessionId),
    body.data.resolutions,
  );

  if (result.ok) {
    stopDevServer(sessionServerKey(owned.worktreeSessionId));
    await removeSessionWorktree(owned.projectId, owned.worktreeSessionId);
    return res.json(result);
  }
  res.status(result.reason === "failed" ? 500 : 422).json(result);
});

gitRouter.post("/session/:id/revert", async (req, res) => {
  const owned = await ownedSessionWorktree(req.params.id, req.userId!);
  if (!owned) {
    return res.status(404).json({ error: "not found" });
  }

  const result = await revertLastTurn(owned.projectId, owned.worktreeSessionId);
  if (!result.ok) {
    return res.status(result.status).json({
      error: { code: result.code, message: result.message, details: {}, requestId: requestIdOf(res) },
    });
  }
  res.json({ ok: true, revertedTurn: result.revertedTurn });
});
