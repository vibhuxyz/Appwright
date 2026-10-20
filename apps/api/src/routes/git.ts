import { Router, type Request } from "express";
import {
  detectConflicts,
  diffSession,
  mergeSession,
  resolveConflicts,
  ResolveConflictsRequest,
  revertSession,
} from "@repo/tools";
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

gitRouter.get("/session/:id/conflicts", async (req, res) => {
  const projectId = await ownedSessionProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return res.status(404).json({ error: "not found" });
  }

  const report = await detectConflicts(
    projectRepoPath(projectId),
    `agent/${req.params.id}`,
  );
  res.json(report);
});

gitRouter.post("/session/:id/merge/resolve", async (req, res) => {
  const body = ResolveConflictsRequest.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: body.error.message });
  }
  const projectId = await ownedSessionProjectId(req.params.id, req.userId!);
  if (!projectId) {
    return res.status(404).json({ error: "not found" });
  }

  const result = await resolveConflicts(
    projectRepoPath(projectId),
    `agent/${req.params.id}`,
    body.data.resolutions,
  );

  if (result.ok) {
    stopDevServer(sessionServerKey(req.params.id));
    await removeSessionWorktree(projectId, req.params.id);
    return res.json(result);
  }
  res.status(result.reason === "failed" ? 500 : 422).json(result);
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
