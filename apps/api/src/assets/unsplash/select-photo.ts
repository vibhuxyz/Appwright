import type { AssetSlot, UnsplashPhoto } from "@repo/contracts";
import { serializeAssetRequest } from "@repo/assets";
import type { UnsplashClient } from "@repo/media";
import { publishAssetRequest } from "../../stream/sse";
import { claimSlot, type ClaimMode } from "../claim-slot";
import type { FillStockFailure, FillStockSuccess } from "../fill-stock";
import { markSlotResolved } from "../mark-slot-resolved";
import { persistUnsplashPhoto } from "./persist-photo";

export interface SelectUnsplashPhotoInput {
  readonly projectId: string;
  readonly sessionId: string;
  readonly assetRequestId: string;
  readonly slot: AssetSlot;
  readonly photo: UnsplashPhoto;
  readonly client: UnsplashClient;
}

function claimModeFor(slot: AssetSlot): ClaimMode {
  return slot.status === "RESOLVED" || slot.status === "SKIPPED" ? "replace" : "first-fill";
}

export async function selectUnsplashPhoto(
  input: SelectUnsplashPhotoInput,
): Promise<FillStockSuccess | FillStockFailure> {
  const claimed = await claimSlot({
    assetRequestId: input.assetRequestId,
    slotId: input.slot.id,
    status: "GENERATING",
    mode: claimModeFor(input.slot),
  });
  if (!claimed.ok) {
    const isBusy = claimed.reason === "IN_PROGRESS";
    return {
      ok: false,
      status: isBusy ? 409 : 404,
      code: claimed.reason,
      message: isBusy ? "Asset slot is already being resolved" : "Asset slot not found",
    };
  }

  try {
    const saved = await persistUnsplashPhoto({
      ...input,
      slot: claimed.slot,
      searchText: input.photo.description ?? claimed.slot.suggestedPrompt,
    });
    const assetRequest = serializeAssetRequest(saved.assetRequest);
    publishAssetRequest(input.sessionId, assetRequest);
    return { ok: true, assetRequest };
  } catch {
    const failed = await markSlotResolved({
      assetRequestId: input.assetRequestId,
      slotId: input.slot.id,
      status: "FAILED",
    });
    publishAssetRequest(input.sessionId, serializeAssetRequest(failed));
    return { ok: false, status: 502, code: "UNSPLASH_SELECT_FAILED", message: "Could not save the selected photo" };
  }
}
