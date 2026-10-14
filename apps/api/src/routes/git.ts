import { Router, type Request } from "express";
import { diffSession, mergeSession, revertSession } from "@repo/tools";
import { ownedSessionProjectId } from "../ownership";
import {
  projectRepoPath,
  removeSessionWorktree,
  sessionServerKey,
  sessionWorktreePath,
  stopDevServer,
} from "../workspace/manager";

export const gitRouter = Router();

gitRouter.get("/session/:id/diff", async (req, res) => {
  const projectId = await ownedSessionProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return res.status(404).json({ error: "not found" });
  }

  const repoDir = projectRepoPath(projectId);
  const branchName = `agent/${req.params.id}`;
  const diffs = await diffSession(repoDir, branchName);
  res.json(diffs);
});

gitRouter.post("/session/:id/merge", async (req, res) => {
  const projectId = await ownedSessionProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return res.status(404).json({ error: "not found" });
  }

  const repoDir = projectRepoPath(projectId);
  const branchName = `agent/${req.params.id}`;
  const result = await mergeSession(repoDir, branchName);

  if (result.ok) {
    stopDevServer(sessionServerKey(req.params.id));
    await removeSessionWorktree(projectId, req.params.id);
  }

  res.json(result);
});

gitRouter.post("/session/:id/revert", async (req, res) => {
  const projectId = await ownedSessionProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return res.status(404).json({ error: "not found" });
  }

  const worktreeDir = sessionWorktreePath(projectId, req.params.id);
  const ok = await revertSession(worktreeDir);
  res.json({ ok });
});
