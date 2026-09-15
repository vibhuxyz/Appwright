import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agentApi } from "../api/agentApi";

// TanStack Query dedupes concurrent calls with the same key on its own, so
// this replaces a hand-rolled in-flight-request map that existed only to
// survive React StrictMode's double-invoked effects.
export function useSession(projectId: string) {
  return useQuery({
    queryKey: ["session", projectId],
    queryFn: () =>
      agentApi
        .listSessions(projectId)
        .then((sessions) => sessions[0] ?? agentApi.createSession(projectId)),
    staleTime: Infinity,
  });
}

export function useUpdateSessionModel(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, model }: { sessionId: string; model: string }) =>
      agentApi.updateSessionModel(sessionId, model),
    onSuccess: (session) => {
      queryClient.setQueryData(["session", projectId], session);
    },
  });
}

export function useCreateSession(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => agentApi.createSession(projectId),
    onSuccess: (session) => {
      queryClient.setQueryData(["session", projectId], session);
    },
  });
}
