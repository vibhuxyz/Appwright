import { useQuery } from "@tanstack/react-query";
import { planApi } from "../api/plan-api";
import { planKeys } from "../api/query-keys";

const BLUEPRINT_STALE_MS = 5 * 60_000;

export function useBlueprint(blueprintId: string) {
  return useQuery({
    queryKey: planKeys.blueprint(blueprintId),
    queryFn: ({ signal }) => planApi.getBlueprint(blueprintId, signal),
    staleTime: BLUEPRINT_STALE_MS,
  });
}
