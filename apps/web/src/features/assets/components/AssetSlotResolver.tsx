import type { AssetSlot } from "@repo/contracts";
import type { useResolveSlot } from "../hooks/use-resolve-slot";
import { AssetSlotRow } from "./AssetSlotRow";

type SlotResolver = ReturnType<typeof useResolveSlot>;

interface AssetSlotResolverProps {
  assetRequestId: string;
  slot: AssetSlot;
  resolver: SlotResolver;
}

function mutationErrorFor(
  mutation: { isError: boolean; error: unknown; variables?: { slotId: string } },
  slotId: string,
): string | undefined {
  if (!mutation.isError || mutation.variables?.slotId !== slotId) return undefined;
  return mutation.error instanceof Error ? mutation.error.message : undefined;
}

function isPendingFor(mutation: { isPending: boolean; variables?: { slotId: string } }, slotId: string): boolean {
  return mutation.isPending && mutation.variables?.slotId === slotId;
}

export function AssetSlotResolver({ assetRequestId, slot, resolver }: AssetSlotResolverProps) {
  const { upload, generate, skip, fillRemaining, selectPhoto } = resolver;
  return (
    <AssetSlotRow
      slot={slot}
      isUploading={isPendingFor(upload, slot.id)}
      isGenerating={isPendingFor(generate, slot.id)}
      isDeciding={isPendingFor(skip, slot.id) || fillRemaining.isPending}
      isSelecting={isPendingFor(selectPhoto, slot.id)}
      error={
        mutationErrorFor(upload, slot.id) ??
        mutationErrorFor(generate, slot.id) ??
        mutationErrorFor(skip, slot.id) ??
        mutationErrorFor(selectPhoto, slot.id)
      }
      onSelectPhoto={(photo) => selectPhoto.mutate({ assetRequestId, slotId: slot.id, photo })}
      onUpload={(file) => upload.mutate({ assetRequestId, slotId: slot.id, file })}
      onGenerate={(prompt) => generate.mutate({ assetRequestId, slotId: slot.id, prompt })}
      onDecide={() => skip.mutate({ assetRequestId, slotId: slot.id })}
    />
  );
}
