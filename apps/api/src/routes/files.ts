import { listProjectPaths, readProjectFile } from "@repo/contracts/files";
import { Router } from "express";
import { ownedProjectId, ownedSessionWorktree } from "../ownership";
import { hydrateSessionFilesFromToolCalls } from "../workspace/hydrate-session-files";

export const filesRouter = Router();

filesRouter.get("/files/:projectId", async (req, res) => {
  if (!(await ownedProjectId(req.params.projectId, req.userId!))) {
    return res.status(404).json({ error: "not found" });
  }
  const sessionId =
    typeof req.query.sessionId === "string" ? req.query.sessionId : undefined;
  const owned = sessionId
    ? await ownedSessionWorktree(sessionId, req.userId!)
    : undefined;
  if (owned === null) {
    return res.status(404).json({ error: "not found" });
  }
  if (owned) {
    await hydrateSessionFilesFromToolCalls(
      req.params.projectId,
      owned.worktreeSessionId,
    );
  }
  const paths = await listProjectPaths(
    req.params.projectId,
    owned?.worktreeSessionId,
  );
  res.json({ paths });
});

filesRouter.get("/files/:projectId/content", async (req, res) => {
  if (!(await ownedProjectId(req.params.projectId, req.userId!))) {
    return res.status(404).json({ error: "not found" });
  }
  const relPath = String(req.query.path ?? "");
  if (!relPath) {
    return res.status(400).json({ error: "path query param required" });
  }
  const sessionId =
    typeof req.query.sessionId === "string" ? req.query.sessionId : undefined;
  const owned = sessionId
    ? await ownedSessionWorktree(sessionId, req.userId!)
    : undefined;
  if (owned === null) {
    return res.status(404).json({ error: "not found" });
  }
  if (owned) {
    await hydrateSessionFilesFromToolCalls(
      req.params.projectId,
      owned.worktreeSessionId,
    );
  }
  try {
    const content = await readProjectFile(
      req.params.projectId,
      relPath,
      owned?.worktreeSessionId,
    );
    res.json({ path: relPath, content });
  } catch (err) {
    res
      .status(404)
      .json({ error: err instanceof Error ? err.message : String(err) });
  }
});
