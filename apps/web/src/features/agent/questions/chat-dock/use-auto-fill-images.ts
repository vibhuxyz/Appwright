import type { AssetRequestResponse } from "@repo/contracts";
import { useEffect, useRef } from "react";
import { useResolveSlot } from "@/features/assets";

export function useAutoFillImages(input: {
  sessionId: string | undefined;
  projectId: string;
  autoRequests: readonly AssetRequestResponse[];
}) {
  const { fillRemaining } = useResolveSlot(input.sessionId ?? "", input.projectId);
  const requestedIdsRef = useRef(new Set<string>());
  const { mutate } = fillRemaining;

  useEffect(() => {
    for (const request of input.autoRequests) {
      if (requestedIdsRef.current.has(request.id)) continue;
      requestedIdsRef.current.add(request.id);
      mutate({ assetRequestId: request.id });
    }
  }, [input.autoRequests, mutate]);

  return { isFilling: fillRemaining.isPending, error: fillRemaining.error };
}
