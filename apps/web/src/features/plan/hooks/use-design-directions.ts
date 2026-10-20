import { useQuery } from "@tanstack/react-query";
import { planApi } from "../api/plan-api";
import { planKeys } from "../api/query-keys";

export function useDesignDirections(prompt: string, enabled: boolean) {
  return useQuery({
    queryKey: planKeys.designDirections(prompt),
    queryFn: ({ signal }) => planApi.getDesignDirections(prompt, signal),
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
