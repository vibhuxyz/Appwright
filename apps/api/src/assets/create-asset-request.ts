import type { Blueprint } from "@repo/contracts";
import { prisma, type Prisma } from "@repo/db";
import { detectAssetSlots } from "@repo/media";
import { publishAssetRequest } from "../stream/sse";
import { serializeAssetRequest } from "./serialize";

export async function createAssetRequest(
  sessionId: string,
  blueprintId: string,
  blueprint: Blueprint,
): Promise<string | null> {
  const slots = detectAssetSlots(blueprint);
  if (slots.length === 0) return null;

  const row = await prisma.assetRequest.create({
    data: {
      sessionId,
      blueprintId,
      slots: slots as Prisma.InputJsonValue,
      status: "PENDING",
    },
  });

  publishAssetRequest(sessionId, serializeAssetRequest(row));
  return row.id;
}
