import { useQuery } from "@tanstack/react-query";
import { planApi } from "../api/plan-api";
import { planKeys } from "../api/query-keys";

const PLAN_STALE_MS = 60_000;

export function usePlanContract(runId: string) {
  return useQuery({
    queryKey: planKeys.plan(runId),
    queryFn: ({ signal }) => planApi.getPlan(runId, signal),
    staleTime: PLAN_STALE_MS,
  });
}
