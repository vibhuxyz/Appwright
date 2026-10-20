import { AssetSlotSchema } from "@repo/contracts";
import { prisma, type Prisma } from "@repo/db";
import { z } from "zod";

const SlotsSchema = z.array(AssetSlotSchema);

type ResolvedStatus = "RESOLVED" | "SKIPPED";

export async function markSlotResolved(
  assetRequestId: string,
  slotId: string,
  assetId: string | null,
  status: ResolvedStatus,
) {
  const row = await prisma.assetRequest.findUniqueOrThrow({ where: { id: assetRequestId } });
  const slots = SlotsSchema.parse(row.slots);
  const updatedSlots = slots.map((slot) => (slot.id === slotId ? { ...slot, status, assetId } : slot));
  const allDone = updatedSlots.every((slot) => slot.status === "RESOLVED" || slot.status === "SKIPPED");

  return prisma.assetRequest.update({
    where: { id: assetRequestId },
    data: {
      slots: updatedSlots as Prisma.InputJsonValue,
      status: allDone ? "RESOLVED" : "PENDING",
      resolvedAt: allDone ? new Date() : null,
    },
  });
}
