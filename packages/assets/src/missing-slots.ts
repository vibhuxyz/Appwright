import { AssetSlotSchema, type AssetSlot } from "@repo/contracts";
import { z } from "zod";

const SlotsSchema = z.array(AssetSlotSchema);
const MAX_LISTED_SLOTS = 10;

export function unresolvedRequiredSlots(rawSlotLists: readonly unknown[]): AssetSlot[] {
  return rawSlotLists
    .flatMap((raw) => {
      const parsed = SlotsSchema.safeParse(raw);
      return parsed.success ? parsed.data : [];
    })
    .filter((slot) => slot.required && slot.status !== "RESOLVED");
}

function describeSlot(slot: AssetSlot): string {
  const state = slot.status === "SKIPPED" ? "skipped" : slot.status === "FAILED" ? "failed" : "waiting";
  return `${slot.purpose} on ${slot.pageRoute} (${state})`;
}

export function formatMissingAssetsNotice(slots: readonly AssetSlot[]): string | undefined {
  if (slots.length === 0) return undefined;
  const listed = slots.slice(0, MAX_LISTED_SLOTS).map(describeSlot).join("; ");
  const extra = slots.length > MAX_LISTED_SLOTS ? ` (+${slots.length - MAX_LISTED_SLOTS} more)` : "";
  return (
    `⚠️ The site is built but not finished: ${slots.length} required image(s) are still missing — ` +
    `${listed}${extra}. Placeholders are shown until you upload or generate them.`
  );
}
