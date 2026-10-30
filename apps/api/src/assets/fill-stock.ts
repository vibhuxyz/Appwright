import type { AssetSlot } from "@repo/contracts";
import { serializeAssetRequest } from "@repo/assets";
import { prisma } from "@repo/db";
import { claimSlot } from "./claim-slot";
import { markSlotResolved } from "./mark-slot-resolved";
import { resolveStock } from "./resolve-stock";
import { reuseHeroForSocial } from "./reuse-hero-for-social";
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

function claimFailure(reason: "NOT_FOUND" | "ALREADY_RESOLVED" | "IN_PROGRESS"): FillStockFailure {
  const isBusy = reason === "IN_PROGRESS";
  return {
    ok: false,
    status: isBusy ? 409 : 404,
    code: reason,
    message: isBusy ? "Asset slot is already being resolved" : "Asset slot not found",
  };
}

export async function fillStockSlot(input: FillStockInput): Promise<FillStockSuccess | FillStockFailure> {
  const claimed = await claimSlot({
    assetRequestId: input.assetRequestId,
    slotId: input.slot.id,
    status: "GENERATING",
  });
  if (!claimed.ok) return claimFailure(claimed.reason);

  try {
    const filled = await resolveStock({
      userId: input.userId,
      projectId: input.projectId,
      sessionId: input.sessionId,
      assetRequestId: input.assetRequestId,
      slot: claimed.slot,
    });
    if (!filled.ok) {
      return failOrReuseSocial(input, {
        ok: false,
        status: filled.error.code === "TIMEOUT" ? 503 : 502,
        code: filled.error.code,
        message: filled.error.message,
      });
    }
    const assetRequest = serializeAssetRequest(filled.result.assetRequest);
    publishAssetRequest(input.sessionId, assetRequest);
    return { ok: true, assetRequest };
  } catch {
    return failOrReuseSocial(input, {
      ok: false,
      status: 502,
      code: "STOCK_FAILED",
      message: "Could not fetch a matching photo for this section",
    });
  }
}

async function failOrReuseSocial(
  input: FillStockInput,
  failure: FillStockFailure,
): Promise<FillStockSuccess | FillStockFailure> {
  const reused = await reuseHeroForSocial(input);
  if (reused) return { ok: true, assetRequest: reused.assetRequest };
  const failed = await markSlotResolved({
    assetRequestId: input.assetRequestId,
    slotId: input.slot.id,
    status: "FAILED",
  });
  publishAssetRequest(input.sessionId, serializeAssetRequest(failed));
  return failure;
}

export async function fillRemainingStockSlots(
  input: Omit<FillStockInput, "slot"> & { readonly slots: readonly AssetSlot[] },
): Promise<FillStockSuccess | FillStockFailure> {
  let last: FillStockSuccess | undefined;
  let firstFailure: FillStockFailure | undefined;
  for (const slot of input.slots) {
    if (slot.status === "RESOLVED" || slot.status === "SKIPPED" || slot.status === "UPLOADING" || slot.status === "GENERATING") {
      continue;
    }
    const result = await fillStockSlot({ ...input, slot });
    if (!result.ok) firstFailure ??= result;
    else last = result;
  }
  if (firstFailure) return firstFailure;
  if (last) return last;
  const row = await prisma.assetRequest.findUniqueOrThrow({ where: { id: input.assetRequestId } });
  const assetRequest = serializeAssetRequest(row);
  publishAssetRequest(input.sessionId, assetRequest);
  return { ok: true, assetRequest };
}
