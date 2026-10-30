import type { AssetSlot } from "@repo/contracts";
import { stockSearchQuery } from "./stock-query";

const MAX_SEARCH_CHARS = 120;

function pageSubject(altText: string): string {
  const separator = altText.indexOf(": ");
  if (separator === -1) return "";
  return altText.slice(separator + 2).replace(/\s+/g, " ").trim();
}

export function photoSearchQuery(slot: Pick<AssetSlot, "purpose" | "altText" | "suggestedPrompt">): string {
  const prompt = slot.suggestedPrompt.replace(/\s+/g, " ").trim();
  if (slot.purpose !== "social") return stockSearchQuery(slot) || prompt.slice(0, MAX_SEARCH_CHARS);
  const subject = pageSubject(slot.altText);
  if (!subject) return prompt.slice(0, MAX_SEARCH_CHARS);
  const suffix = " wide photograph";
  return `${subject.slice(0, MAX_SEARCH_CHARS - suffix.length)}${suffix}`;
}

function isReadyImage(slot: AssetSlot): boolean {
  return (slot.status === "RESOLVED" || slot.status === "SKIPPED") && Boolean(slot.finalPath);
}

export function heroStandIn(slots: readonly AssetSlot[], socialSlotId: string): AssetSlot | undefined {
  const social = slots.find((slot) => slot.id === socialSlotId);
  if (!social || social.purpose !== "social") return undefined;
  const ready = slots.filter(isReadyImage);
  return (
    ready.find((slot) => slot.purpose === "hero" && slot.pageRoute === social.pageRoute) ??
    ready.find((slot) => slot.purpose === "hero")
  );
}
