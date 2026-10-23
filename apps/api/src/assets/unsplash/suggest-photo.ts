import type { AssetSlot } from "@repo/contracts";
import { prisma } from "@repo/db";
import type { UnsplashClient } from "@repo/media";
import { log } from "../../log";
import { orientationForAspect } from "./orientation";
import { persistUnsplashPhoto } from "./persist-photo";
import { pickUnusedPhoto } from "./pick-unused-photo";

const SUGGESTION_CANDIDATES = 8;

export interface SuggestUnsplashInput {
  readonly projectId: string;
  readonly sessionId: string;
  readonly assetRequestId: string;
  readonly slot: AssetSlot;
  readonly client: UnsplashClient;
}

async function usedPhotoIds(sessionId: string): Promise<Set<string>> {
  const rows = await prisma.projectAsset.findMany({
    where: { sessionId, externalId: { not: null } },
    select: { externalId: true },
  });
  return new Set(rows.flatMap((row) => (row.externalId ? [row.externalId] : [])));
}

export async function suggestUnsplashPhoto(input: SuggestUnsplashInput) {
  const searched = await input.client.search({
    query: input.slot.suggestedPrompt.slice(0, 120),
    page: 1,
    perPage: SUGGESTION_CANDIDATES,
    orientation: orientationForAspect(input.slot.aspectRatio),
    contentFilter: "high",
  });
  if (!searched.ok) {
    log.warn("unsplash suggestion unavailable", {
      slotId: input.slot.id,
      sessionId: input.sessionId,
      code: searched.error.code,
    });
    return null;
  }

  const photo = pickUnusedPhoto(searched.value.items, await usedPhotoIds(input.sessionId));
  if (!photo) return null;

  return persistUnsplashPhoto({
    projectId: input.projectId,
    sessionId: input.sessionId,
    assetRequestId: input.assetRequestId,
    slot: input.slot,
    photo,
    searchText: input.slot.suggestedPrompt,
    client: input.client,
  });
}
