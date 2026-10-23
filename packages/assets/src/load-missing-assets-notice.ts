import { prisma } from "@repo/db";
import { formatMissingAssetsNotice, unresolvedRequiredSlots } from "./missing-slots";

export async function loadMissingAssetsNotice(sessionId: string): Promise<string | undefined> {
  const requests = await prisma.assetRequest.findMany({
    where: { sessionId },
    select: { slots: true },
  });
  return formatMissingAssetsNotice(unresolvedRequiredSlots(requests.map((request) => request.slots)));
}
