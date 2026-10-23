import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectDatabaseEnvironment } from "@repo/contracts";
import { projectDatabaseApi } from "../api/projectDatabaseApi";

export function projectDatabasesQueryKey(projectId: string) {
  return ["project-databases", projectId] as const;
}

export function useProjectDatabases(projectId: string | undefined) {
  return useQuery({
    queryKey: projectDatabasesQueryKey(projectId ?? ""),
    queryFn: ({ signal }) => projectDatabaseApi.list(projectId!, signal),
    enabled: Boolean(projectId),
    staleTime: 15_000,
  });
}

export function useRetryProjectDatabase(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (environment: ProjectDatabaseEnvironment) =>
      projectDatabaseApi.retry(projectId, environment),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectDatabasesQueryKey(projectId),
      });
    },
  });
}
