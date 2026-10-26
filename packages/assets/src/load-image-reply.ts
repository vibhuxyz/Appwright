import { AssetSlotSchema, imageReply, type QuestionReplyData } from "@repo/contracts";
import { prisma } from "@repo/db";
import { z } from "zod";

const SlotsSchema = z.array(AssetSlotSchema);

export async function loadImageReply(assetRequestId: string): Promise<QuestionReplyData | null> {
  const row = await prisma.assetRequest.findUnique({ where: { id: assetRequestId }, select: { slots: true } });
  const parsed = SlotsSchema.safeParse(row?.slots);
  if (!parsed.success || parsed.data.length === 0) return null;
  const assetIds = parsed.data.flatMap((slot) => (slot.assetId ? [slot.assetId] : []));
  const assets = assetIds.length > 0
    ? await prisma.projectAsset.findMany({ where: { id: { in: assetIds } }, select: { id: true, source: true } })
    : [];
  const sourceById = new Map(assets.map((asset) => [asset.id, asset.source]));
  return imageReply(parsed.data.map((slot) => ({
    componentName: slot.componentName,
    pageRoute: slot.pageRoute,
    status: slot.status,
    source: slot.assetId ? sourceById.get(slot.assetId) ?? null : null,
  })));
}
