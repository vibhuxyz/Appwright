import { Router } from "express";
import { liveFramePath, screenshotPath } from "../browser-report";
import { ownedSessionProjectId } from "../ownership";

const SEND_FROM_DOT_DIRECTORY = { dotfiles: "allow" as const };

export const browserScreenshotsRouter = Router();

function requestIdOf(res: { getHeader(name: string): unknown }): string {
  const value = res.getHeader("x-request-id");
  return typeof value === "string" ? value : "";
}

function notFound(res: { getHeader(name: string): unknown }, message = "screenshot not found") {
  return { error: { code: "NOT_FOUND", message, details: {}, requestId: requestIdOf(res) } };
}

browserScreenshotsRouter.get("/v1/sessions/:sessionId/browser-live", async (req, res) => {
  const userId = req.userId;
  const sessionId = req.params.sessionId;
  if (!userId || !sessionId) return res.status(404).json(notFound(res, "browser view not found"));
  const projectId = await ownedSessionProjectId(sessionId, userId);
  const filePath = projectId ? liveFramePath(projectId, sessionId) : null;
  if (!filePath) return res.status(404).json(notFound(res, "browser view not found"));
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(filePath, SEND_FROM_DOT_DIRECTORY, (error) => {
    if (error && !res.headersSent) res.status(404).json(notFound(res, "browser view not found"));
  });
});

browserScreenshotsRouter.get("/v1/sessions/:sessionId/browser-screenshots/:fileName", async (req, res) => {
  const projectId = await ownedSessionProjectId(req.params.sessionId, req.userId!);
  const filePath = projectId ? screenshotPath(projectId, req.params.sessionId, req.params.fileName) : null;
  if (!filePath) return res.status(404).json(notFound(res));
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.sendFile(filePath, SEND_FROM_DOT_DIRECTORY, (error) => {
    if (error && !res.headersSent) res.status(404).json(notFound(res));
  });
});
