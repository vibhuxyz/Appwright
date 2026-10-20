import { ImagePlus } from "lucide-react";
import type { AssetRequestResponse } from "@repo/contracts";
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
  const { upload, generate, skip } = useResolveSlot(sessionId, projectId);
  const pendingSlots = assetRequest.slots.filter(
    (slot) => slot.status !== "RESOLVED" && slot.status !== "SKIPPED",
  );

  if (pendingSlots.length === 0) return null;

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-sm backdrop-blur-sm">
      <div className="flex items-center gap-2 font-medium text-sky-300">
        <ImagePlus className="h-4 w-4 shrink-0" />
        <span>This app needs {pendingSlots.length} image{pendingSlots.length === 1 ? "" : "s"}</span>
      </div>

      <div className="mt-2.5 flex flex-col gap-2">
        {pendingSlots.map((slot) => {
          const uploadError = mutationErrorFor(upload, slot.id);
          const generateError = mutationErrorFor(generate, slot.id);

          return (
            <AssetSlotRow
              key={slot.id}
              slot={slot}
              isUploading={upload.isPending && upload.variables?.slotId === slot.id}
              isGenerating={generate.isPending && generate.variables?.slotId === slot.id}
              isSkipping={skip.isPending && skip.variables?.slotId === slot.id}
              error={uploadError ?? generateError}
              onUpload={(file) => upload.mutate({ assetRequestId: assetRequest.id, slotId: slot.id, file })}
              onGenerate={(prompt) =>
                generate.mutate({ assetRequestId: assetRequest.id, slotId: slot.id, prompt })
              }
              onSkip={() => skip.mutate({ assetRequestId: assetRequest.id, slotId: slot.id })}
            />
          );
        })}
      </div>
    </div>
  );
}
