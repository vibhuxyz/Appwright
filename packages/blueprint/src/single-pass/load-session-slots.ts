import { AssetSlotSchema, type AssetSlot } from "@repo/contracts";
import { prisma } from "@repo/db";
import { z } from "zod";

const SlotsSchema = z.array(AssetSlotSchema);

export interface SessionSlots {
  readonly slots: AssetSlot[];
  readonly skipped: { readonly assetRequestId: string; readonly reason: string }[];
}

export async function loadSessionAssetSlots(sessionId: string): Promise<SessionSlots> {
  const requests = await prisma.assetRequest.findMany({
    where: { sessionId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, slots: true },
  });
  const slots: AssetSlot[] = [];
  const skipped: SessionSlots["skipped"] = [];
  for (const request of requests) {
    const parsed = SlotsSchema.safeParse(request.slots);
    if (parsed.success) slots.push(...parsed.data);
    else skipped.push({ assetRequestId: request.id, reason: `Invalid slots: ${parsed.error.message}` });
  }
  return { slots, skipped };
}
