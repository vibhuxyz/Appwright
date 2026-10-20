import type { AssetSlot } from "@repo/contracts";
import { imageProviderFor, type ImageGenerationError } from "@repo/media";
import { finalizeAsset } from "./finalize-asset";

const GENERATE_TIMEOUT_MS = 45_000;

export interface ResolveGenerateInput {
  readonly userId: string;
  readonly projectId: string;
  readonly sessionId: string;
  readonly assetRequestId: string;
  readonly slot: AssetSlot;
  readonly prompt: string;
}

export type ResolveGenerateResult =
  | { readonly ok: true; readonly result: Awaited<ReturnType<typeof finalizeAsset>> }
  | { readonly ok: false; readonly error: ImageGenerationError };

export async function resolveGenerate(input: ResolveGenerateInput): Promise<ResolveGenerateResult> {
  const provider = imageProviderFor();
  const generated = await provider.generate({
    prompt: input.prompt,
    signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
  });

  if (!generated.ok) {
    return { ok: false, error: generated.error };
  }

  const result = await finalizeAsset({
    userId: input.userId,
    projectId: input.projectId,
    sessionId: input.sessionId,
    assetRequestId: input.assetRequestId,
    slotId: input.slot.id,
    purpose: input.slot.purpose,
    altText: input.slot.altText,
    source: "GENERATED",
    prompt: input.prompt,
    bytes: generated.value.bytes,
    mimeType: generated.value.mimeType,
  });

  return { ok: true, result };
}
