import { Router, type Response } from "express";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import { stat } from "node:fs/promises";
import { getAttachmentById, getProjectAttachments } from "@repo/db";
import { parseMultipartAttachment, storeAndIngestAttachment } from "../attachments";
import { ownedProjectId } from "../ownership";

export const attachmentRouter = Router({ mergeParams: true });

const ATTACHMENT_BASE_DIR =
  process.env.STORAGE_DIR || join(process.cwd(), ".workspaces", "attachments");

function requestIdOf(res: Response): string {
  const value = res.getHeader("x-request-id");
  return typeof value === "string" ? value : "";
}

attachmentRouter.post("/v1/projects/:id/attachments/upload", async (req, res) => {
  const projectId = req.params.id;
  const isOwner = await ownedProjectId(projectId, req.userId!);
  if (!isOwner) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "project not found", requestId: requestIdOf(res) },
    });
  }

  const parsed = await parseMultipartAttachment(req);
  if (!parsed.ok) {
    const status = parsed.code === "TOO_LARGE" ? 413 : 400;
    return res.status(status).json({
      error: { code: parsed.code, message: parsed.message, requestId: requestIdOf(res) },
    });
  }

  const sessionId =
    typeof req.query.sessionId === "string" && req.query.sessionId.trim().length > 0
      ? req.query.sessionId.trim()
      : undefined;

  try {
    const attachment = await storeAndIngestAttachment({
      projectId,
      sessionId,
      filename: parsed.file.filename,
      mimeType: parsed.file.mimeType,
      type: parsed.file.type,
      extension: parsed.file.extension,
      bytes: parsed.file.bytes,
    });
    return res.status(201).json(attachment);
  } catch (err: unknown) {
    return res.status(500).json({
      error: {
        code: "INGESTION_FAILED",
        message: `Failed to store attachment: ${String(err)}`,
        requestId: requestIdOf(res),
      },
    });
  }
});

attachmentRouter.get("/v1/projects/:id/attachments", async (req, res) => {
  const projectId = req.params.id;
  const isOwner = await ownedProjectId(projectId, req.userId!);
  if (!isOwner) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "project not found", requestId: requestIdOf(res) },
    });
  }

  const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId : undefined;
  const list = await getProjectAttachments(projectId, sessionId);
  return res.json(list);
});

attachmentRouter.get("/v1/projects/:id/attachments/:attachmentId/download", async (req, res) => {
  const projectId = req.params.id;
  const isOwner = await ownedProjectId(projectId, req.userId!);
  if (!isOwner) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "project not found", requestId: requestIdOf(res) },
    });
  }

  const attachment = await getAttachmentById(req.params.attachmentId);
  if (!attachment || attachment.projectId !== projectId) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "attachment not found", requestId: requestIdOf(res) },
    });
  }

  const filePath = join(ATTACHMENT_BASE_DIR, projectId, attachment.storageKey);
  try {
    await stat(filePath);
  } catch {
    return res.status(404).json({
      error: { code: "FILE_MISSING", message: "attachment file missing", requestId: requestIdOf(res) },
    });
  }

  res.setHeader("Content-Type", attachment.mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${attachment.name}"`);
  createReadStream(filePath).pipe(res);
});
