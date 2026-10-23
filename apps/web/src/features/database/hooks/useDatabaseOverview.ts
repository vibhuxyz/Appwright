import { useQuery } from "@tanstack/react-query";
import { databaseApi } from "../api/databaseApi";

export function databaseOverviewQueryKey(projectId: string) {
  return ["project-database-overview", projectId] as const;
}

export function useDatabaseOverview(projectId: string | undefined) {
  return useQuery({
    queryKey: databaseOverviewQueryKey(projectId ?? ""),
    queryFn: ({ signal }) => databaseApi.getOverview(projectId ?? "", signal),
    enabled: Boolean(projectId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "provisioning" || status === "pending" ? 3000 : 15_000;
    },
  });
}
