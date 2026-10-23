import { AVAILABLE_MODELS } from "@repo/contracts";
import { useQuery } from "@tanstack/react-query";
import { agentApi } from "../api/agentApi";
import type { AvailableModel } from "../schemas/agentSchemas";

export const FALLBACK_MODELS: AvailableModel[] = [...AVAILABLE_MODELS];

export function useAvailableModels() {
  return useQuery({
    queryKey: ["available-models"],
    queryFn: ({ signal }) => agentApi.getAvailableModels(signal),
    staleTime: 1000 * 60 * 10,
    placeholderData: FALLBACK_MODELS,
  });
}
