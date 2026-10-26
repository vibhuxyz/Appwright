import { canAccessCodebase } from "@repo/contracts";
import { listProjectPaths, readProjectFile } from "@repo/contracts/files";
import { prisma } from "@repo/db";
import { Router } from "express";
import { ownedProjectId, ownedSessionWorktree } from "../ownership";
import { createProjectZip, hydrateSessionFilesFromToolCalls } from "../workspace";

export const filesRouter = Router();

const SUBSCRIPTION_ERROR = {
  error: {
    code: "SUBSCRIPTION_REQUIRED",
    message: "Viewing or downloading the codebase requires an active paid subscription.",
  },
};

async function verifyCodebaseAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return Boolean(user && canAccessCodebase(user.plan));
}

filesRouter.get("/files/:projectId", async (req, res) => {
  if (!(await ownedProjectId(req.params.projectId, req.userId!))) {
    return res.status(404).json({ error: "not found" });
  }
  if (!(await verifyCodebaseAccess(req.userId!))) {
    return res.status(403).json(SUBSCRIPTION_ERROR);
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
  if (!(await verifyCodebaseAccess(req.userId!))) {
    return res.status(403).json(SUBSCRIPTION_ERROR);
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

filesRouter.get("/files/:projectId/download", async (req, res) => {
  if (!(await ownedProjectId(req.params.projectId, req.userId!))) {
    return res.status(404).json({ error: "not found" });
  }
  if (!(await verifyCodebaseAccess(req.userId!))) {
    return res.status(403).json(SUBSCRIPTION_ERROR);
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
    const zipBuffer = await createProjectZip(
      req.params.projectId,
      owned?.worktreeSessionId,
    );
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      select: { name: true },
    });
    const safeName = (project?.name || "project")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.zip"`);
    res.setHeader("Content-Length", zipBuffer.length);
    res.send(zipBuffer);
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : String(err) });
  }
});
