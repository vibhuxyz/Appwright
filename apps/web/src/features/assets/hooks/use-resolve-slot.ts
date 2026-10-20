import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assetsApi } from "../api/assets-api";
import { assetKeys } from "../api/query-keys";

export function useResolveSlot(sessionId: string, projectId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: assetKeys.requests(sessionId) });
    if (projectId) queryClient.invalidateQueries({ queryKey: assetKeys.project(projectId) });
  };

  const upload = useMutation({
    mutationFn: ({ assetRequestId, slotId, file }: { assetRequestId: string; slotId: string; file: File }) =>
      assetsApi.uploadSlot(assetRequestId, slotId, file),
    onSuccess: invalidate,
  });

  const generate = useMutation({
    mutationFn: ({
      assetRequestId,
      slotId,
      prompt,
    }: {
      assetRequestId: string;
      slotId: string;
      prompt: string;
    }) => assetsApi.generateSlot(assetRequestId, slotId, prompt),
    onSuccess: invalidate,
  });

  const skip = useMutation({
    mutationFn: ({ assetRequestId, slotId }: { assetRequestId: string; slotId: string }) =>
      assetsApi.skipSlot(assetRequestId, slotId),
    onSuccess: invalidate,
  });

  return { upload, generate, skip };
}
