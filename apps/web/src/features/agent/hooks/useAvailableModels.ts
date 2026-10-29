import { useQuery } from "@tanstack/react-query";
import { agentApi } from "../api/agentApi";

export function useAvailableModels() {
  return useQuery({
    queryKey: ["available-models"],
    queryFn: ({ signal }) => agentApi.getAvailableModels(signal),
    staleTime: 1000 * 60 * 10,
  });
}
