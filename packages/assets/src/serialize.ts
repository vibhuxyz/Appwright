import { AssetRequestResponse, AssetSlotSchema } from "@repo/contracts";
import { z } from "zod";

const SlotsSchema = z.array(AssetSlotSchema);

export function serializeAssetRequest(row: {
  id: string;
  sessionId: string;
  blueprintId: string;
  slots: unknown;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
}): AssetRequestResponse {
  return AssetRequestResponse.parse({
    id: row.id,
    sessionId: row.sessionId,
    blueprintId: row.blueprintId,
    slots: SlotsSchema.parse(row.slots),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  });
}
