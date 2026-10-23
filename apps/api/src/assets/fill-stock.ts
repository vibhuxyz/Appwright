import type { AssetSlot } from "@repo/contracts";
import { serializeAssetRequest } from "@repo/assets";
import { prisma } from "@repo/db";
import { claimSlot } from "./claim-slot";
import { markSlotResolved } from "./mark-slot-resolved";
import { resolveStock } from "./resolve-stock";
import { publishAssetRequest } from "../stream/sse";

export interface FillStockInput {
  readonly userId: string;
  readonly projectId: string;
  readonly sessionId: string;
  readonly assetRequestId: string;
  readonly slot: AssetSlot;
}

export type FillStockFailure = {
  readonly ok: false;
  readonly status: number;
  readonly code: string;
  readonly message: string;
};

export type FillStockSuccess = {
  readonly ok: true;
  readonly assetRequest: ReturnType<typeof serializeAssetRequest>;
};

export async function fillStockSlot(input: FillStockInput): Promise<FillStockSuccess | FillStockFailure> {
  const claimed = await claimSlot({
    assetRequestId: input.assetRequestId,
    slotId: input.slot.id,
    status: "GENERATING",
  });
  if (!claimed.ok) {
    return {
      ok: false,
      status: claimed.reason === "IN_PROGRESS" ? 409 : 404,
      code: claimed.reason,
      message: claimed.reason === "IN_PROGRESS" ? "Asset slot is already being resolved" : "Asset slot not found",
    };
  }

  try {
    const filled = await resolveStock({
      userId: input.userId,
      projectId: input.projectId,
      sessionId: input.sessionId,
      assetRequestId: input.assetRequestId,
      slot: claimed.slot,
    });
    if (!filled.ok) {
      const failed = await markSlotResolved({
        assetRequestId: input.assetRequestId,
        slotId: input.slot.id,
        status: "FAILED",
      });
      publishAssetRequest(input.sessionId, serializeAssetRequest(failed));
      return {
        ok: false,
        status: filled.error.code === "TIMEOUT" ? 503 : 502,
        code: filled.error.code,
        message: filled.error.message,
      };
    }
    const assetRequest = serializeAssetRequest(filled.result.assetRequest);
    publishAssetRequest(input.sessionId, assetRequest);
    return { ok: true, assetRequest };
  } catch {
    const failed = await markSlotResolved({
      assetRequestId: input.assetRequestId,
      slotId: input.slot.id,
      status: "FAILED",
    });
    publishAssetRequest(input.sessionId, serializeAssetRequest(failed));
    return {
      ok: false,
      status: 502,
      code: "STOCK_FAILED",
      message: "Could not fetch a matching photo for this section",
    };
  }
}

export async function fillRemainingStockSlots(
  input: Omit<FillStockInput, "slot"> & { readonly slots: readonly AssetSlot[] },
): Promise<FillStockSuccess | FillStockFailure> {
  let last: FillStockSuccess | FillStockFailure | undefined;
  for (const slot of input.slots) {
    if (slot.status === "RESOLVED" || slot.status === "SKIPPED" || slot.status === "UPLOADING" || slot.status === "GENERATING") {
      continue;
    }
    last = await fillStockSlot({ ...input, slot });
    if (!last.ok) return last;
  }
  if (last) return last;
  const row = await prisma.assetRequest.findUniqueOrThrow({ where: { id: input.assetRequestId } });
  const assetRequest = serializeAssetRequest(row);
  publishAssetRequest(input.sessionId, assetRequest);
  return { ok: true, assetRequest };
}
