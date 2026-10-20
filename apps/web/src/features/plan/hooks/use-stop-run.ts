import { useMutation, useQueryClient } from "@tanstack/react-query";
import { planApi } from "../api/plan-api";
import { planKeys } from "../api/query-keys";

export function useStopRun(runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => planApi.stopRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.run(runId) });
    },
  });
}
