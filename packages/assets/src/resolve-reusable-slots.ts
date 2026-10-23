import type { AssetPurpose, AssetSlot, UnsplashAttribution } from "@repo/contracts";
import { SITE_WIDE_PURPOSES } from "@repo/media";

export interface ReusableAsset {
  readonly id: string;
  readonly localPath: string;
  readonly purpose: AssetPurpose;
  readonly altText?: string;
  readonly attribution?: UnsplashAttribution;
}

export function reusablePurposesIn(slots: readonly AssetSlot[]): AssetPurpose[] {
  return [...new Set(slots.map((slot) => slot.purpose))];
}

function withAsset(slot: AssetSlot, asset: ReusableAsset): AssetSlot {
  return {
    ...slot,
    status: "RESOLVED",
    assetId: asset.id,
    finalPath: asset.localPath,
    ...(asset.attribution ? { attribution: asset.attribution } : {}),
  };
}

export function resolveReusableSlots(
  slots: readonly AssetSlot[],
  assets: readonly ReusableAsset[],
): AssetSlot[] {
  const used = new Set<string>();
  return slots.map((slot) => {
    if (SITE_WIDE_PURPOSES.has(slot.purpose)) {
      const shared = assets.find((asset) => asset.purpose === slot.purpose);
      return shared ? withAsset(slot, shared) : slot;
    }

    const exact = assets.find(
      (asset) => asset.purpose === slot.purpose && asset.altText === slot.altText && !used.has(asset.id),
    );
    const samePurpose = assets.find((asset) => asset.purpose === slot.purpose && !used.has(asset.id));
    const match = exact ?? samePurpose;
    if (!match) return slot;
    used.add(match.id);
    return withAsset(slot, match);
  });
}
