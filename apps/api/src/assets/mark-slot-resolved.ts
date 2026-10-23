import { AssetSlotSchema, type AssetSlot, type UnsplashAttribution } from "@repo/contracts";
import { prisma, type Prisma } from "@repo/db";
import { z } from "zod";

const SlotsSchema = z.array(AssetSlotSchema);

type SlotOutcome = "RESOLVED" | "SKIPPED" | "FAILED";

export interface MarkSlotInput {
  readonly assetRequestId: string;
  readonly slotId: string;
  readonly status: SlotOutcome;
  readonly assetId?: string | null;
  readonly finalPath?: string;
  readonly attribution?: UnsplashAttribution;
}

function isDone(slot: AssetSlot): boolean {
  return slot.status === "RESOLVED" || slot.status === "SKIPPED";
}

export function applySlotOutcome(slots: readonly AssetSlot[], input: MarkSlotInput): AssetSlot[] {
  return slots.map((slot) =>
    slot.id === input.slotId
      ? {
          ...slot,
          status: input.status,
          assetId: input.assetId ?? null,
          attribution: input.attribution,
          ...(input.finalPath ? { finalPath: input.finalPath } : {}),
        }
      : slot,
  );
}

export async function markSlotResolved(input: MarkSlotInput) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AssetRequest" WHERE id = ${input.assetRequestId} FOR UPDATE`;
    const row = await tx.assetRequest.findUniqueOrThrow({ where: { id: input.assetRequestId } });
    const updatedSlots = applySlotOutcome(SlotsSchema.parse(row.slots), input);
    const allDone = updatedSlots.every(isDone);

    return tx.assetRequest.update({
      where: { id: input.assetRequestId },
      data: {
        slots: updatedSlots as Prisma.InputJsonValue,
        status: allDone ? "RESOLVED" : "PENDING",
        resolvedAt: allDone ? new Date() : null,
      },
    });
  });
}
