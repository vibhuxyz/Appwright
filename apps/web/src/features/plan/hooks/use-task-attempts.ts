import { useQuery } from "@tanstack/react-query";
import { planApi } from "../api/plan-api";
import { planKeys } from "../api/query-keys";

const RUNNING_POLL_INTERVAL_MS = 2_000;

interface Options {
  runId: string;
  taskId: string;
  isOpen: boolean;
  isTaskRunning: boolean;
}

export function useTaskAttempts({ runId, taskId, isOpen, isTaskRunning }: Options) {
  return useQuery({
    queryKey: planKeys.attempts(runId, taskId),
    queryFn: ({ signal }) => planApi.getTaskAttempts(runId, taskId, signal),
    enabled: isOpen,
    staleTime: 0,
    refetchInterval: isTaskRunning ? RUNNING_POLL_INTERVAL_MS : false,
  });
}
