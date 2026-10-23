import type { AssetSlot } from "@repo/contracts";
import { searchStockImage, sharedUnsplashClient, type StockSearchError } from "@repo/media";
import { finalizeAsset } from "./finalize-asset";
import { suggestUnsplashPhoto } from "./unsplash";

const STOCK_TIMEOUT_MS = 25_000;

export interface ResolveStockInput {
  readonly userId: string;
  readonly projectId: string;
  readonly sessionId: string;
  readonly assetRequestId: string;
  readonly slot: AssetSlot;
}

export type ResolveStockResult =
  | { readonly ok: true; readonly result: Awaited<ReturnType<typeof finalizeAsset>> }
  | { readonly ok: false; readonly error: StockSearchError };

export async function resolveStock(input: ResolveStockInput): Promise<ResolveStockResult> {
  const suggested = await suggestUnsplashPhoto({
    projectId: input.projectId,
    sessionId: input.sessionId,
    assetRequestId: input.assetRequestId,
    slot: input.slot,
    client: sharedUnsplashClient(),
  });
  if (suggested) return { ok: true, result: suggested };

  const found = await searchStockImage({
    query: input.slot.suggestedPrompt,
    signal: AbortSignal.timeout(STOCK_TIMEOUT_MS),
  });

  if (!found.ok) return { ok: false, error: found.error };

  const result = await finalizeAsset({
    userId: input.userId,
    projectId: input.projectId,
    sessionId: input.sessionId,
    assetRequestId: input.assetRequestId,
    slotId: input.slot.id,
    purpose: input.slot.purpose,
    altText: input.slot.altText,
    source: "SEARCHED",
    prompt: input.slot.suggestedPrompt,
    bytes: found.value.bytes,
    mimeType: found.value.mimeType,
  });

  return { ok: true, result };
}
