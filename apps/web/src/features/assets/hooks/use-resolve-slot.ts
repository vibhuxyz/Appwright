import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UnsplashPhoto } from "@repo/contracts";
import { assetsApi } from "../api/assets-api";
import { assetKeys } from "../api/query-keys";
import { unsplashApi } from "../api/unsplash-api";

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

  const fillRemaining = useMutation({
    mutationFn: ({ assetRequestId }: { assetRequestId: string }) =>
      assetsApi.fillRemainingStock(assetRequestId),
    onSuccess: invalidate,
  });

  const selectPhoto = useMutation({
    mutationFn: ({
      assetRequestId,
      slotId,
      photo,
    }: {
      assetRequestId: string;
      slotId: string;
      photo: UnsplashPhoto;
    }) => unsplashApi.selectForSlot(assetRequestId, slotId, photo),
    onSuccess: invalidate,
  });

  return { upload, generate, skip, fillRemaining, selectPhoto };
}
