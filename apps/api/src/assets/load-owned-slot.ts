import { AssetSlotSchema, type AssetSlot } from "@repo/contracts";
import { prisma } from "@repo/db";
import { z } from "zod";
import { ownedAssetRequestSessionId, ownedSessionProjectId } from "../ownership";

const SlotsSchema = z.array(AssetSlotSchema);

export type OwnedSlotError = "NOT_FOUND" | "SLOT_NOT_FOUND" | "ALREADY_RESOLVED";
export type OwnedSlotResult =
  | { readonly error: OwnedSlotError }
  | { readonly sessionId: string; readonly projectId: string; readonly slot: AssetSlot };

export async function loadOwnedAssetRequest(
  assetRequestId: string,
  userId: string,
): Promise<
  | { readonly error: OwnedSlotError }
  | { readonly sessionId: string; readonly projectId: string; readonly slots: readonly AssetSlot[] }
> {
  const sessionId = await ownedAssetRequestSessionId(assetRequestId, userId);
  if (!sessionId) return { error: "NOT_FOUND" };

  const projectId = await ownedSessionProjectId(sessionId, userId);
  if (!projectId) return { error: "NOT_FOUND" };

  const row = await prisma.assetRequest.findUniqueOrThrow({ where: { id: assetRequestId } });
  return { sessionId, projectId, slots: SlotsSchema.parse(row.slots) };
}

export async function loadOwnedSlot(
  assetRequestId: string,
  slotId: string,
  userId: string,
): Promise<OwnedSlotResult> {
  const owned = await loadOwnedAnySlot(assetRequestId, slotId, userId);
  if ("error" in owned) return owned;
  if (owned.slot.status === "RESOLVED" || owned.slot.status === "SKIPPED") {
    return { error: "ALREADY_RESOLVED" };
  }
  return owned;
}

export async function loadOwnedAnySlot(
  assetRequestId: string,
  slotId: string,
  userId: string,
): Promise<OwnedSlotResult> {
  const sessionId = await ownedAssetRequestSessionId(assetRequestId, userId);
  if (!sessionId) return { error: "NOT_FOUND" };

  const projectId = await ownedSessionProjectId(sessionId, userId);
  if (!projectId) return { error: "NOT_FOUND" };

  const row = await prisma.assetRequest.findUniqueOrThrow({ where: { id: assetRequestId } });
  const slots = SlotsSchema.parse(row.slots);
  const slot = slots.find((candidate) => candidate.id === slotId);
  if (!slot) return { error: "SLOT_NOT_FOUND" };

  return { sessionId, projectId, slot };
}
