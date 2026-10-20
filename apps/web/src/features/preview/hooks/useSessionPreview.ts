import { useQuery, useQueryClient } from "@tanstack/react-query";
import { agentApi } from "@/features/agent/api/agentApi";
import type { Session } from "@/features/agent/schemas/agentSchemas";

const LIVENESS_POLL_MS = 30_000;

export function useSessionPreview(
  sessionId: string | undefined,
  enabled = true,
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["session-preview", sessionId],
    queryFn: async ({ signal }) => {
      const preview = await agentApi.startPreview(sessionId!, signal);
      queryClient.setQueriesData<Session>({ queryKey: ["session"] }, (old) =>
        old && old.id === sessionId
          ? { ...old, previewUrl: preview.previewUrl, devPort: preview.devPort }
          : old,
      );
      return preview;
    },
    enabled: Boolean(sessionId) && enabled,
    staleTime: LIVENESS_POLL_MS,
    refetchInterval: LIVENESS_POLL_MS,
    refetchOnWindowFocus: true,
  });
}
