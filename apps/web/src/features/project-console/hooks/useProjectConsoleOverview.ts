import { useQuery } from "@tanstack/react-query";
import { projectConsoleApi } from "../api/projectConsoleApi";

export function projectConsoleOverviewQueryKey(projectId: string) {
  return ["project-console-overview", projectId] as const;
}

export function useProjectConsoleOverview(projectId: string | undefined) {
  return useQuery({
    queryKey: projectConsoleOverviewQueryKey(projectId ?? ""),
    queryFn: ({ signal }) => projectConsoleApi.getOverview(projectId ?? "", signal),
    enabled: Boolean(projectId),
    refetchInterval: 10_000,
  });
}
