import { Router, type Request } from "express";
import {
  detectConflicts,
  diffSession,
  mergeSession,
  resolveConflicts,
  ResolveConflictsRequest,
  revertSession,
} from "@repo/tools";
import { sessionBranchName } from "@repo/workspace";
import { ownedSessionWorktree } from "../ownership";
import {
  projectRepoPath,
  removeSessionWorktree,
  sessionServerKey,
  sessionWorktreePath,
  stopDevServer,
} from "../workspace/manager";

export const gitRouter = Router();

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

  const worktreeDir = sessionWorktreePath(
    owned.projectId,
    owned.worktreeSessionId,
  );
  const ok = await revertSession(worktreeDir);
  res.json({ ok });
});
