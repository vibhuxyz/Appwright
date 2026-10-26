import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IntegrationConfigurationRequest } from "@repo/contracts";
import { environmentApi } from "../api";
import { environmentKeys } from "./useEnvironment";

export const integrationKeys = {
  catalog: (projectId: string) => ["integrations", projectId] as const,
};

export function useIntegrationCatalog(projectId?: string) {
  return useQuery({
    queryKey: integrationKeys.catalog(projectId ?? ""),
    queryFn: ({ signal }) => environmentApi.getIntegrationCatalog(projectId ?? "", signal),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
}

export function useConfigureIntegration(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IntegrationConfigurationRequest) =>
      environmentApi.configureIntegration(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.catalog(projectId) });
      queryClient.invalidateQueries({ queryKey: environmentKeys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: environmentKeys.pending(projectId) });
    },
  });
}

export function useDisconnectIntegration(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { provider: string; environment: string }) =>
      environmentApi.disconnectIntegration(projectId, input.provider, input.environment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.catalog(projectId) });
      queryClient.invalidateQueries({ queryKey: environmentKeys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: environmentKeys.pending(projectId) });
    },
  });
}
