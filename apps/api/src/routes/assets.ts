import {
  AssetSlotSchema,
  GenerateAssetRequest,
  ListProjectAssetsResponse,
  type AssetSlot,
} from "@repo/contracts";
import { prisma } from "@repo/db";
import { Router } from "express";
import { z } from "zod";
import {
  markSlotResolved,
  parseUploadedImage,
  resolveGenerate,
  resolveUpload,
  serializeAssetRequest,
  serializeProjectAsset,
} from "../assets";
import { ownedAssetRequestSessionId, ownedProjectId, ownedSessionProjectId } from "../ownership";
import { publishAssetRequest } from "../stream/sse";

export const assetsRouter = Router();

const SlotsSchema = z.array(AssetSlotSchema);
const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 100;

function requestIdOf(res: { getHeader(name: string): unknown }): string {
  const value = res.getHeader("x-request-id");
  return typeof value === "string" ? value : "";
}

function errorResponse(code: string, message: string, res: { getHeader(name: string): unknown }) {
  return { error: { code, message, details: {}, requestId: requestIdOf(res) } };
}

type OwnedSlotError = "NOT_FOUND" | "SLOT_NOT_FOUND" | "ALREADY_RESOLVED";
type OwnedSlotResult =
  | { readonly error: OwnedSlotError }
  | { readonly sessionId: string; readonly projectId: string; readonly slot: AssetSlot };

async function loadOwnedSlot(
  assetRequestId: string,
  slotId: string,
  userId: string,
): Promise<OwnedSlotResult> {
  const sessionId = await ownedAssetRequestSessionId(assetRequestId, userId);
  if (!sessionId) return { error: "NOT_FOUND" };

  const projectId = await ownedSessionProjectId(sessionId, userId);
  if (!projectId) return { error: "NOT_FOUND" };

  const row = await prisma.assetRequest.findUniqueOrThrow({ where: { id: assetRequestId } });
  const slots = SlotsSchema.parse(row.slots);
  const slot = slots.find((candidate) => candidate.id === slotId);
  if (!slot) return { error: "SLOT_NOT_FOUND" };
  if (slot.status === "RESOLVED" || slot.status === "SKIPPED") {
    return { error: "ALREADY_RESOLVED" };
  }

  return { sessionId, projectId, slot };
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
    return res.status(status).json(errorResponse(upload.code, "Could not read the uploaded image", res));
  }

  const { asset, assetRequest } = await resolveUpload({
    userId: req.userId!,
    projectId: owned.projectId,
    sessionId: owned.sessionId,
    assetRequestId: req.params.id,
    slot: owned.slot,
    bytes: upload.bytes,
    mimeType: upload.mimeType,
  });

  publishAssetRequest(owned.sessionId, serializeAssetRequest(assetRequest));
  res.status(201).json(serializeProjectAsset(asset));
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

  const generated = await resolveGenerate({
    userId: req.userId!,
    projectId: owned.projectId,
    sessionId: owned.sessionId,
    assetRequestId: req.params.id,
    slot: owned.slot,
    prompt: parsed.data.prompt,
  });

  if (!generated.ok) {
    const status = generated.error.code === "PROVIDER_TIMEOUT" ? 503 : 502;
    return res.status(status).json(errorResponse(generated.error.code, generated.error.message, res));
  }

  publishAssetRequest(owned.sessionId, serializeAssetRequest(generated.result.assetRequest));
  res.status(201).json(serializeProjectAsset(generated.result.asset));
});

assetsRouter.post("/asset-requests/:id/slots/:slotId/skip", async (req, res) => {
  const owned = await loadOwnedSlot(req.params.id, req.params.slotId, req.userId!);
  if ("error" in owned) {
    return res.status(404).json(errorResponse(owned.error, "Asset slot not found", res));
  }

  const assetRequest = await markSlotResolved(req.params.id, req.params.slotId, null, "SKIPPED");
  publishAssetRequest(owned.sessionId, serializeAssetRequest(assetRequest));
  res.json(serializeAssetRequest(assetRequest));
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
