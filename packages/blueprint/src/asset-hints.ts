import { AssetSlotSchema, type AssetSlot, type UnsplashAttribution } from "@repo/contracts";
import { z } from "zod";

const SlotsSchema = z.array(AssetSlotSchema);
const MAX_CREDIT_NAME_CHARS = 80;
const PAGE_TITLE_PATTERN = /^Page (\/\S*):/;
const MAX_HINTS = 8;

export function pageRouteOf(title: string): string | undefined {
  return PAGE_TITLE_PATTERN.exec(title)?.[1];
}

function creditInstruction(attribution: UnsplashAttribution): string {
  const name = JSON.stringify(attribution.photographerName.replace(/\s+/g, " ").trim().slice(0, MAX_CREDIT_NAME_CHARS));
  return `; this is a hotlinked Unsplash photo, so keep the URL as given and never download or copy it, show a visible credit "Photo by" ${name} "on Unsplash" next to it where the name links to ${attribution.photographerUrl} and Unsplash links to ${attribution.photoUrl}, and if you use next/image make sure images.remotePatterns allows images.unsplash.com`;
}

function describeSlot(slot: AssetSlot): string {
  const usage = `${slot.purpose} for ${slot.componentName} (alt: "${slot.altText}"${
    slot.aspectRatio ? `, ratio ${slot.aspectRatio}` : ""
  })`;
  if (slot.finalPath && slot.attribution) {
    return `${usage} — use ${slot.finalPath}${creditInstruction(slot.attribution)}`;
  }
  if (slot.finalPath) return `${usage} — use ${slot.finalPath}`;
  return `${usage} — image not ready yet: render a neutral placeholder block with the same aspect ratio and the alt text, and keep the image source in one named constant`;
}

export function assetHintsFor(title: string, rawSlotLists: readonly unknown[]): string[] {
  const route = pageRouteOf(title);
  if (!route) return [];
  return rawSlotLists
    .flatMap((raw) => {
      const parsed = SlotsSchema.safeParse(raw);
      return parsed.success ? parsed.data : [];
    })
    .filter((slot) => slot.pageRoute === route)
    .slice(0, MAX_HINTS)
    .map(describeSlot);
}
