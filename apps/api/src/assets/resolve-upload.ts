import type { AssetSlot } from "@repo/contracts";
import { finalizeAsset } from "./finalize-asset";

export interface ResolveUploadInput {
  readonly userId: string;
  readonly projectId: string;
  readonly sessionId: string;
  readonly assetRequestId: string;
  readonly slot: AssetSlot;
  readonly bytes: Uint8Array;
  readonly mimeType: string;
}

export function resolveUpload(input: ResolveUploadInput) {
  return finalizeAsset({
    userId: input.userId,
    projectId: input.projectId,
    sessionId: input.sessionId,
    assetRequestId: input.assetRequestId,
    slotId: input.slot.id,
    purpose: input.slot.purpose,
    altText: input.slot.altText,
    source: "UPLOADED",
    bytes: input.bytes,
    mimeType: input.mimeType,
  });
}
