import { z } from "zod";
import { AssetSlotSchema, ProjectAssetResponse, UnsplashAttribution, type AssetSlot } from "@repo/contracts";
import { serializeAssetRequest } from "@repo/assets";
import { prisma } from "@repo/db";
import { publishAssetRequest } from "../stream/sse";
import { markSlotResolved } from "./mark-slot-resolved";
import { serializeProjectAsset } from "./serialize";
import { heroStandIn } from "./social-fallback";

const SlotsSchema = z.array(AssetSlotSchema);

async function assetResponse(input: {
  projectId: string;
  sessionId: string;
  slot: AssetSlot;
  hero: AssetSlot;
}) {
  if (!input.hero.finalPath) return undefined;
  if (input.hero.assetId) {
    const row = await prisma.projectAsset.findUnique({ where: { id: input.hero.assetId } });
    if (row) return serializeProjectAsset(row);
  }
  const attribution = UnsplashAttribution.safeParse(input.hero.attribution);
  return ProjectAssetResponse.parse({
    id: input.hero.assetId ?? input.slot.id,
    projectId: input.projectId,
    sessionId: input.sessionId,
    purpose: input.slot.purpose,
    source: "SEARCHED",
    prompt: null,
    url: input.hero.finalPath,
    localPath: input.hero.finalPath,
    altText: input.slot.altText,
    externalId: null,
    attribution: attribution.success ? attribution.data : null,
    createdAt: new Date().toISOString(),
  });
}

export async function reuseHeroForSocial(input: {
  assetRequestId: string;
  projectId: string;
  sessionId: string;
  slot: AssetSlot;
}) {
  if (input.slot.purpose !== "social") return undefined;
  const row = await prisma.assetRequest.findUnique({ where: { id: input.assetRequestId } });
  if (!row) return undefined;
  const hero = heroStandIn(SlotsSchema.parse(row.slots), input.slot.id);
  if (!hero?.finalPath) return undefined;
  const asset = await assetResponse({ ...input, hero });
  if (!asset) return undefined;

  const updated = await markSlotResolved({
    assetRequestId: input.assetRequestId,
    slotId: input.slot.id,
    status: "RESOLVED",
    assetId: hero.assetId ?? null,
    finalPath: hero.finalPath,
    attribution: hero.attribution,
  });
  const assetRequest = serializeAssetRequest(updated);
  publishAssetRequest(input.sessionId, assetRequest);
  return { assetRequest, asset };
}
