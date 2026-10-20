import { useQuery } from "@tanstack/react-query";
import { planApi } from "../api/plan-api";
import { planKeys } from "../api/query-keys";

export function useLatestBlueprintRun(sessionId: string | undefined) {
  return useQuery({
    queryKey: planKeys.latestRun(sessionId ?? ""),
    queryFn: ({ signal }) => planApi.getLatestBlueprintRun(sessionId ?? "", signal),
    enabled: Boolean(sessionId),
    staleTime: 0,
  });
}
