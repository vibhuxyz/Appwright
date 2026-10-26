import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { IntegrationConfigurationRequest, IntegrationConfigurationResponse } from "@repo/contracts";
import { environmentApi } from "../api";
import { environmentKeys, integrationKeys } from "../hooks";

async function submitConfigureRequests(
  projectId: string,
  requests: readonly IntegrationConfigurationRequest[],
): Promise<IntegrationConfigurationResponse[]> {
  const [first, ...rest] = requests;
  if (!first) return [];
  const firstResult = await environmentApi.configureIntegration(projectId, first);
  const restResults = await Promise.all(rest.map((item) => environmentApi.configureIntegration(projectId, item)));
  return [firstResult, ...restResults];
}

export function useCredentialSetup(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requests: readonly IntegrationConfigurationRequest[]) => submitConfigureRequests(projectId, requests),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: integrationKeys.catalog(projectId) });
      void queryClient.invalidateQueries({ queryKey: environmentKeys.project(projectId) });
      void queryClient.invalidateQueries({ queryKey: environmentKeys.pending(projectId) });
    },
  });
}
