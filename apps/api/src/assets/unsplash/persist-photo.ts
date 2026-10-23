import type { AssetSlot, UnsplashPhoto } from "@repo/contracts";
import { prisma } from "@repo/db";
import type { UnsplashClient } from "@repo/media";
import { log } from "../../log";
import { markSlotResolved } from "../mark-slot-resolved";
import { buildUnsplashAssetData } from "./build-asset-data";

export interface PersistUnsplashPhotoInput {
  readonly projectId: string;
  readonly sessionId: string;
  readonly assetRequestId: string;
  readonly slot: AssetSlot;
  readonly photo: UnsplashPhoto;
  readonly searchText: string;
  readonly client: UnsplashClient;
}

export async function persistUnsplashPhoto(input: PersistUnsplashPhotoInput) {
  const tracked = await input.client.trackDownload(input.photo);
  if (!tracked.ok) {
    log.warn("unsplash download tracking failed", {
      photoId: input.photo.id,
      sessionId: input.sessionId,
      code: tracked.error.code,
    });
  }

  const asset = await prisma.projectAsset.create({
    data: buildUnsplashAssetData({
      projectId: input.projectId,
      sessionId: input.sessionId,
      purpose: input.slot.purpose,
      altText: input.slot.altText,
      searchText: input.searchText,
      photo: input.photo,
    }),
  });

  const assetRequest = await markSlotResolved({
    assetRequestId: input.assetRequestId,
    slotId: input.slot.id,
    status: "RESOLVED",
    assetId: asset.id,
    finalPath: input.photo.regularUrl,
    attribution: input.photo.attribution,
  });

  return { asset, assetRequest };
}
