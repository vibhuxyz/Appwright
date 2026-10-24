import { GenerateAssetRequest, ListProjectAssetsResponse } from "@repo/contracts";
import { prisma } from "@repo/db";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
  claimSlot,
  fillRemainingStockSlots,
  fillStockSlot,
  loadOwnedAssetRequest,
  loadOwnedSlot,
  parseUploadedImage,
  resolveGenerate,
  resolveUpload,
  respondFailed,
  reuseHeroForSocial,
  serializeAssetRequest,
  serializeProjectAsset,
} from "../assets";
import { ownedProjectId, ownedSessionProjectId } from "../ownership";
import { publishAssetRequest } from "../stream/sse";

export const assetsRouter = Router();

const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 100;

function requestIdOf(res: { getHeader(name: string): unknown }): string {
  const value = res.getHeader("x-request-id");
  return typeof value === "string" ? value : "";
}

function errorResponse(code: string, message: string, res: { getHeader(name: string): unknown }) {
  return { error: { code, message, details: {}, requestId: requestIdOf(res) } };
}

assetsRouter.get("/asset-requests/:sessionId", async (req, res) => {
  const projectId = await ownedSessionProjectId(req.params.sessionId, req.userId!);
  if (!projectId) {
    return res.status(404).json(errorResponse("NOT_FOUND", "session not found", res));
  }

  const rows = await prisma.assetRequest.findMany({
    where: { sessionId: req.params.sessionId },
    orderBy: { createdAt: "asc" },
  });

  res.json(rows.map(serializeAssetRequest));
});

assetsRouter.post("/asset-requests/:id/slots/:slotId/upload", async (req, res) => {
  const owned = await loadOwnedSlot(req.params.id, req.params.slotId, req.userId!);
  if ("error" in owned) {
    return res.status(404).json(errorResponse(owned.error, "Asset slot not found", res));
  }

  const upload = await parseUploadedImage(req);
  if (!upload.ok) {
    const status = upload.code === "TOO_LARGE" ? 413 : 400;
    const message =
      upload.code === "TOO_LARGE"
        ? "That file is over 5 MB. Upload a PNG, JPEG, or JPG under 5 MB."
        : "Upload a PNG, JPEG, or JPG under 5 MB.";
    return res.status(status).json(errorResponse(upload.code, message, res));
  }

  const claimed = await claimSlot({
    assetRequestId: req.params.id,
    slotId: req.params.slotId,
    status: "UPLOADING",
  });
  if (!claimed.ok) {
    return res.status(409).json(errorResponse(claimed.reason, "Asset slot is already being resolved", res));
  }

  try {
    const { asset, assetRequest } = await resolveUpload({
      userId: req.userId!,
      projectId: owned.projectId,
      sessionId: owned.sessionId,
      assetRequestId: req.params.id,
      slot: claimed.slot,
      bytes: upload.bytes,
      mimeType: upload.mimeType,
    });
    publishAssetRequest(owned.sessionId, serializeAssetRequest(assetRequest));
    return res.status(201).json(serializeProjectAsset(asset));
  } catch {
    return respondFailed({
      res,
      sessionId: owned.sessionId,
      assetRequestId: req.params.id,
      slotId: req.params.slotId,
      code: "UPLOAD_FAILED",
      message: "Could not finalize the uploaded image",
      status: 502,
    });
  }
});

assetsRouter.post("/asset-requests/:id/slots/:slotId/generate", async (req, res) => {
  const owned = await loadOwnedSlot(req.params.id, req.params.slotId, req.userId!);
  if ("error" in owned) {
    return res.status(404).json(errorResponse(owned.error, "Asset slot not found", res));
  }

  const parsed = GenerateAssetRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(errorResponse("INVALID_REQUEST", "A prompt is required", res));
  }

  const claimed = await claimSlot({
    assetRequestId: req.params.id,
    slotId: req.params.slotId,
    status: "GENERATING",
  });
  if (!claimed.ok) {
    return res.status(409).json(errorResponse(claimed.reason, "Asset slot is already being resolved", res));
  }

  let generated: Awaited<ReturnType<typeof resolveGenerate>>;
  try {
    generated = await resolveGenerate({
      userId: req.userId!,
      projectId: owned.projectId,
      sessionId: owned.sessionId,
      assetRequestId: req.params.id,
      slot: claimed.slot,
      prompt: parsed.data.prompt,
    });
  } catch {
    const reused = await reuseHeroForSocial({
      assetRequestId: req.params.id,
      projectId: owned.projectId,
      sessionId: owned.sessionId,
      slot: claimed.slot,
    });
    if (reused) return res.status(201).json(reused.asset);
    return respondFailed({
      res,
      sessionId: owned.sessionId,
      assetRequestId: req.params.id,
      slotId: req.params.slotId,
      code: "GENERATION_FAILED",
      message: "Could not finalize the generated image",
      status: 502,
    });
  }

  if (!generated.ok) {
    const reused = await reuseHeroForSocial({
      assetRequestId: req.params.id,
      projectId: owned.projectId,
      sessionId: owned.sessionId,
      slot: claimed.slot,
    });
    if (reused) return res.status(201).json(reused.asset);
    const status = generated.error.code === "PROVIDER_TIMEOUT" ? 503 : 502;
    return respondFailed({
      res,
      sessionId: owned.sessionId,
      assetRequestId: req.params.id,
      slotId: req.params.slotId,
      code: generated.error.code,
      message: generated.error.message,
      status,
    });
  }

  publishAssetRequest(owned.sessionId, serializeAssetRequest(generated.result.assetRequest));
  res.status(201).json(serializeProjectAsset(generated.result.asset));
});

const SlotParams = z.object({ id: z.string().min(1), slotId: z.string().min(1) });

async function stockSlot(req: Request, res: Response) {
  const parsed = SlotParams.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json(errorResponse("INVALID_REQUEST", "Asset slot not found", res));
  }
  const owned = await loadOwnedSlot(parsed.data.id, parsed.data.slotId, req.userId!);
  if ("error" in owned) {
    return res.status(404).json(errorResponse(owned.error, "Asset slot not found", res));
  }
  const filled = await fillStockSlot({
    userId: req.userId!,
    projectId: owned.projectId,
    sessionId: owned.sessionId,
    assetRequestId: parsed.data.id,
    slot: owned.slot,
  });
  if (!filled.ok) {
    return res.status(filled.status).json(errorResponse(filled.code, filled.message, res));
  }
  return res.status(201).json(filled.assetRequest);
}

assetsRouter.post("/asset-requests/:id/slots/:slotId/skip", stockSlot);
assetsRouter.post("/asset-requests/:id/slots/:slotId/stock", stockSlot);

assetsRouter.post("/asset-requests/:id/stock", async (req, res) => {
  const owned = await loadOwnedAssetRequest(req.params.id, req.userId!);
  if ("error" in owned) {
    return res.status(404).json(errorResponse(owned.error, "Asset request not found", res));
  }
  const filled = await fillRemainingStockSlots({
    userId: req.userId!,
    projectId: owned.projectId,
    sessionId: owned.sessionId,
    assetRequestId: req.params.id,
    slots: owned.slots,
  });
  if (!filled.ok) {
    return res.status(filled.status).json(errorResponse(filled.code, filled.message, res));
  }
  res.status(201).json(filled.assetRequest);
});

assetsRouter.get("/projects/:projectId/assets", async (req, res) => {
  const ownedId = await ownedProjectId(req.params.projectId, req.userId!);
  if (!ownedId) {
    return res.status(404).json(errorResponse("NOT_FOUND", "project not found", res));
  }

  const limit = Math.min(Number(req.query.limit ?? DEFAULT_PAGE_LIMIT) || DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

  const rows = await prisma.projectAsset.findMany({
    where: { projectId: req.params.projectId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor = hasMore && last ? last.id : null;

  res.json(ListProjectAssetsResponse.parse({ items: page.map(serializeProjectAsset), nextCursor }));
});
