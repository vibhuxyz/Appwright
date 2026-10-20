import { useQuery } from "@tanstack/react-query";
import { planApi } from "../api/plan-api";
import { planKeys } from "../api/query-keys";
import { isPlanSettled } from "../lib/progress";

const RUN_POLL_INTERVAL_MS = 2_000;

export function useRun(runId: string) {
  return useQuery({
    queryKey: planKeys.run(runId),
    queryFn: ({ signal }) => planApi.getRun(runId, signal),
    staleTime: 0,
    refetchInterval: (query) => {
      const tasks = query.state.data?.tasks;
      return tasks && isPlanSettled(tasks) ? false : RUN_POLL_INTERVAL_MS;
    },
  });
}
