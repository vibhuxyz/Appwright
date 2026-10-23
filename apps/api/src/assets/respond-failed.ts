import type { Response } from "express";
import { serializeAssetRequest } from "@repo/assets";
import { markSlotResolved } from "./mark-slot-resolved";
import { publishAssetRequest } from "../stream/sse";

function requestIdOf(res: { getHeader(name: string): unknown }): string {
  const value = res.getHeader("x-request-id");
  return typeof value === "string" ? value : "";
}

export interface FailureInput {
  readonly res: Response;
  readonly sessionId: string;
  readonly assetRequestId: string;
  readonly slotId: string;
  readonly code: string;
  readonly message: string;
  readonly status: number;
}

export async function respondFailed(input: FailureInput) {
  const failedRequest = await markSlotResolved({
    assetRequestId: input.assetRequestId,
    slotId: input.slotId,
    status: "FAILED",
  });
  publishAssetRequest(input.sessionId, serializeAssetRequest(failedRequest));
  return input.res.status(input.status).json({
    error: {
      code: input.code,
      message: input.message,
      details: {},
      requestId: requestIdOf(input.res),
    },
  });
}
