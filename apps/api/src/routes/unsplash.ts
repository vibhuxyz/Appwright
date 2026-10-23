import { SelectUnsplashPhotoRequest, UnsplashSearchQuery, UnsplashSearchResponse } from "@repo/contracts";
import { sharedUnsplashClient, type UnsplashErrorCode } from "@repo/media";
import { Router } from "express";
import { z } from "zod";
import { loadOwnedAnySlot } from "../assets";
import { selectUnsplashPhoto } from "../assets/unsplash";
import { log } from "../log";

export const unsplashRouter = Router();

const SEARCH_CACHE_CONTROL = "private, max-age=60";

const STATUS_BY_CODE: Readonly<Record<UnsplashErrorCode, number>> = {
  NOT_CONFIGURED: 503,
  UNAUTHORIZED: 502,
  FORBIDDEN: 502,
  RATE_LIMITED: 429,
  TIMEOUT: 504,
  PROVIDER_ERROR: 502,
  INVALID_RESPONSE: 502,
};

const SlotParams = z.object({ id: z.string().min(1), slotId: z.string().min(1) });

function requestIdOf(res: { getHeader(name: string): unknown }): string {
  const value = res.getHeader("x-request-id");
  return typeof value === "string" ? value : "";
}

function errorBody(code: string, message: string, res: { getHeader(name: string): unknown }) {
  return { error: { code, message, details: {}, requestId: requestIdOf(res) } };
}

unsplashRouter.get("/unsplash/search", async (req, res) => {
  const parsed = UnsplashSearchQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json(errorBody("INVALID_REQUEST", "A search query is required", res));
  }

  const result = await sharedUnsplashClient().search(parsed.data);
  if (!result.ok) {
    log.warn("unsplash search failed", { code: result.error.code, userId: req.userId });
    return res.status(STATUS_BY_CODE[result.error.code]).json(errorBody(result.error.code, result.error.message, res));
  }

  res.setHeader("Cache-Control", SEARCH_CACHE_CONTROL);
  res.json(UnsplashSearchResponse.parse(result.value));
});

unsplashRouter.post("/asset-requests/:id/slots/:slotId/unsplash", async (req, res) => {
  const params = SlotParams.safeParse(req.params);
  const body = SelectUnsplashPhotoRequest.safeParse(req.body);
  if (!params.success || !body.success) {
    return res.status(400).json(errorBody("INVALID_REQUEST", "A valid Unsplash photo is required", res));
  }

  const owned = await loadOwnedAnySlot(params.data.id, params.data.slotId, req.userId!);
  if ("error" in owned) {
    return res.status(404).json(errorBody(owned.error, "Asset slot not found", res));
  }

  const selected = await selectUnsplashPhoto({
    projectId: owned.projectId,
    sessionId: owned.sessionId,
    assetRequestId: params.data.id,
    slot: owned.slot,
    photo: body.data.photo,
    client: sharedUnsplashClient(),
  });
  if (!selected.ok) {
    return res.status(selected.status).json(errorBody(selected.code, selected.message, res));
  }
  return res.status(201).json(selected.assetRequest);
});
