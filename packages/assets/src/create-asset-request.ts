import type { AssetPurpose, AssetRequestResponse, Blueprint } from "@repo/contracts";
import { AssetPurpose as AssetPurposeSchema, UnsplashAttribution } from "@repo/contracts";
import { prisma, type Prisma } from "@repo/db";
import { detectAssetSlots } from "@repo/media";
import { reusablePurposesIn, resolveReusableSlots, type ReusableAsset } from "./resolve-reusable-slots";
import { serializeAssetRequest } from "./serialize";

async function loadReusableAssets(
  projectId: string,
  purposes: readonly AssetPurpose[],
): Promise<ReusableAsset[]> {
  if (purposes.length === 0) return [];

  const rows = await prisma.projectAsset.findMany({
    where: { projectId, purpose: { in: [...purposes] } },
    orderBy: { createdAt: "asc" },
    select: { purpose: true, id: true, localPath: true, altText: true, attribution: true },
  });

  const assets: ReusableAsset[] = [];
  for (const row of rows) {
    const parsed = AssetPurposeSchema.safeParse(row.purpose);
    if (!parsed.success) continue;
    const attribution = UnsplashAttribution.safeParse(row.attribution);
    assets.push({
      id: row.id,
      localPath: row.localPath,
      purpose: parsed.data,
      altText: row.altText,
      ...(attribution.success ? { attribution: attribution.data } : {}),
    });
  }
  return assets;
}

export async function createAssetRequest(
  sessionId: string,
  projectId: string,
  blueprintId: string,
  blueprint: Blueprint,
): Promise<AssetRequestResponse | null> {
  const detected = detectAssetSlots(blueprint);
  if (detected.length === 0) return null;

  const reusable = await loadReusableAssets(projectId, reusablePurposesIn(detected));
  const slots = resolveReusableSlots(detected, reusable);
  const allResolved = slots.every((slot) => slot.status === "RESOLVED" || slot.status === "SKIPPED");

  const row = await prisma.assetRequest.create({
    data: {
      sessionId,
      blueprintId,
      slots: slots as Prisma.InputJsonValue,
      status: allResolved ? "RESOLVED" : "PENDING",
      resolvedAt: allResolved ? new Date() : null,
    },
  });

  return serializeAssetRequest(row);
}
