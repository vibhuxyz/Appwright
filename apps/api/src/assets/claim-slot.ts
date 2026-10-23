import { AssetSlotSchema, type AssetSlot } from "@repo/contracts";
import { prisma, type Prisma } from "@repo/db";
import { z } from "zod";

const SlotsSchema = z.array(AssetSlotSchema);

export type ClaimableStatus = "UPLOADING" | "GENERATING";
export type ClaimSlotFailureReason = "NOT_FOUND" | "ALREADY_RESOLVED" | "IN_PROGRESS";

export type ClaimMode = "first-fill" | "replace";

export interface ClaimSlotInput {
  readonly assetRequestId: string;
  readonly slotId: string;
  readonly status: ClaimableStatus;
  readonly mode?: ClaimMode;
}

export type ClaimSlotResult =
  | { readonly ok: true; readonly slot: AssetSlot }
  | { readonly ok: false; readonly reason: ClaimSlotFailureReason };

export function reasonFor(slot: AssetSlot, mode: ClaimMode): ClaimSlotFailureReason | undefined {
  if (slot.status === "UPLOADING" || slot.status === "GENERATING") return "IN_PROGRESS";
  const isDone = slot.status === "RESOLVED" || slot.status === "SKIPPED";
  return isDone && mode === "first-fill" ? "ALREADY_RESOLVED" : undefined;
}

export function applyClaim(
  slots: readonly AssetSlot[],
  slotId: string,
  status: ClaimableStatus,
): AssetSlot[] {
  return slots.map((slot) => (slot.id === slotId ? { ...slot, status } : slot));
}

export async function claimSlot(input: ClaimSlotInput): Promise<ClaimSlotResult> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AssetRequest" WHERE id = ${input.assetRequestId} FOR UPDATE`;
    const row = await tx.assetRequest.findUniqueOrThrow({ where: { id: input.assetRequestId } });
    const slots = SlotsSchema.parse(row.slots);
    const slot = slots.find((candidate) => candidate.id === input.slotId);
    if (!slot) return { ok: false, reason: "NOT_FOUND" };

    const blockedBy = reasonFor(slot, input.mode ?? "first-fill");
    if (blockedBy) return { ok: false, reason: blockedBy };

    const updatedSlots = applyClaim(slots, input.slotId, input.status);
    await tx.assetRequest.update({
      where: { id: input.assetRequestId },
      data: { slots: updatedSlots as Prisma.InputJsonValue },
    });

    return { ok: true, slot: { ...slot, status: input.status } };
  });
}
