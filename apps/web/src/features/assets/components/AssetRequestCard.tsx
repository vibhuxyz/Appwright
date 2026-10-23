import { useState } from "react";
import { ChevronDown, ImagePlus, Loader2 } from "lucide-react";
import type { AssetRequestResponse } from "@repo/contracts";
import { cn } from "@/shared/lib/cn";
import { useResolveSlot } from "../hooks/use-resolve-slot";
import { AssetSlotRow } from "./AssetSlotRow";

interface AssetRequestCardProps {
  assetRequest: AssetRequestResponse;
  sessionId: string;
  projectId?: string;
}

function mutationErrorFor(
  mutation: { isError: boolean; error: unknown; variables?: { slotId: string } },
  slotId: string,
): string | undefined {
  if (!mutation.isError || mutation.variables?.slotId !== slotId) return undefined;
  return mutation.error instanceof Error ? mutation.error.message : undefined;
}

export function AssetRequestCard({ assetRequest, sessionId, projectId }: AssetRequestCardProps) {
  const { upload, generate, skip, fillRemaining, selectPhoto } = useResolveSlot(sessionId, projectId);
  const [open, setOpen] = useState(true);
  const pendingSlots = assetRequest.slots.filter(
    (slot) => slot.status !== "RESOLVED" && slot.status !== "SKIPPED",
  );

  if (pendingSlots.length === 0) return null;

  const fillError =
    fillRemaining.isError && fillRemaining.error instanceof Error
      ? fillRemaining.error.message
      : fillRemaining.isError
        ? "Could not pick matching photos"
        : undefined;
  const busy =
    fillRemaining.isPending ||
    upload.isPending ||
    generate.isPending ||
    skip.isPending ||
    selectPhoto.isPending;

  return (
    <div className="my-1 shrink-0 rounded-xl border border-primary/30 bg-primary/5 text-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left font-medium text-foreground"
      >
        <ImagePlus className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          Images for {pendingSlots.length} section{pendingSlots.length === 1 ? "" : "s"}
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div className="px-4 pb-4">
          <p className="text-[11px] text-muted">
            Drop a PNG, JPEG, or JPG on a section, up to 5 MB. You can also search photos, generate
            one, or let me pick a matching photo.
          </p>

          {fillError && (
            <p className="mt-2 text-[11px] text-danger" role="alert">
              {fillError}
            </p>
          )}

          <div className="mt-2.5 flex max-h-[min(34rem,60vh)] flex-col gap-2 overflow-y-auto pr-1">
            {assetRequest.slots.map((slot) => {
              const uploadError = mutationErrorFor(upload, slot.id);
              const generateError = mutationErrorFor(generate, slot.id);
              const decideError = mutationErrorFor(skip, slot.id);
              const photoError = mutationErrorFor(selectPhoto, slot.id);

              return (
                <AssetSlotRow
                  key={slot.id}
                  slot={slot}
                  isUploading={upload.isPending && upload.variables?.slotId === slot.id}
                  isGenerating={generate.isPending && generate.variables?.slotId === slot.id}
                  isDeciding={
                    (skip.isPending && skip.variables?.slotId === slot.id) || fillRemaining.isPending
                  }
                  isSelecting={selectPhoto.isPending && selectPhoto.variables?.slotId === slot.id}
                  error={uploadError ?? generateError ?? decideError ?? photoError}
                  onSelectPhoto={(photo) =>
                    selectPhoto.mutate({ assetRequestId: assetRequest.id, slotId: slot.id, photo })
                  }
                  onUpload={(file) =>
                    upload.mutate({ assetRequestId: assetRequest.id, slotId: slot.id, file })
                  }
                  onGenerate={(prompt) =>
                    generate.mutate({ assetRequestId: assetRequest.id, slotId: slot.id, prompt })
                  }
                  onDecide={() => skip.mutate({ assetRequestId: assetRequest.id, slotId: slot.id })}
                />
              );
            })}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => fillRemaining.mutate({ assetRequestId: assetRequest.id })}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border-soft bg-surface-2 px-3 py-2 text-xs font-medium text-foreground-secondary transition hover:bg-surface-3 disabled:opacity-50"
          >
            {fillRemaining.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            <span>Decide remaining for me</span>
          </button>
        </div>
      )}
    </div>
  );
}
