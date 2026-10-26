import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DeleteEnvironmentVariableRequest,
  EmailProviderType,
  IntegrationEnvironment,
  SendTestEmailRequestType,
  SetEmailProviderRequestType,
  SetEnvironmentVariableRequest,
  TestIntegrationRequest,
  VariableScope,
} from "@repo/contracts";
import { environmentApi } from "../api/environmentApi";

const OVERVIEW_STALE_TIME_MS = 30_000;

export const environmentKeys = {
  all: ["environment"] as const,
  project: (projectId: string) => ["environment", projectId] as const,
  overview: (projectId: string, environment: IntegrationEnvironment) =>
    ["environment", projectId, environment] as const,
  allPending: ["pending-integrations"] as const,
  pending: (projectId: string) => ["pending-integrations", projectId] as const,
  pendingForSession: (projectId: string, sessionId: string) =>
    ["pending-integrations", projectId, sessionId] as const,
};

const PENDING_STALE_TIME_MS = 10_000;

export function useEnvironmentOverview(projectId: string | undefined, environment: IntegrationEnvironment) {
  return useQuery({
    queryKey: environmentKeys.overview(projectId ?? "", environment),
    queryFn: ({ signal }) => environmentApi.getOverview(projectId ?? "", environment, signal),
    enabled: Boolean(projectId),
    staleTime: OVERVIEW_STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });
}

export function usePendingIntegrations(projectId: string, sessionId: string | undefined) {
  return useQuery({
    queryKey: environmentKeys.pendingForSession(projectId, sessionId ?? ""),
    queryFn: ({ signal }) => environmentApi.getPendingIntegrationRequests(sessionId ?? "", signal),
    enabled: Boolean(sessionId),
    staleTime: PENDING_STALE_TIME_MS,
  });
}

export function useSetEnvironmentVariable(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SetEnvironmentVariableRequest) =>
      environmentApi.setVariable(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: environmentKeys.project(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: environmentKeys.pending(projectId),
      });
    },
  });
}

export function useDeleteEnvironmentVariable(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteEnvironmentVariableRequest) =>
      environmentApi.deleteVariable(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: environmentKeys.project(projectId),
      });
    },
  });
}

export function useSetEmailProvider(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SetEmailProviderRequestType) =>
      environmentApi.setEmailProvider(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: environmentKeys.project(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: environmentKeys.pending(projectId),
      });
    },
  });
}

export function useSendTestEmail(projectId: string) {
  return useMutation({
    mutationFn: (input: SendTestEmailRequestType) =>
      environmentApi.sendTestEmail(projectId, input),
  });
}

export function useSaveAndTestIntegration(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      provider: string;
      environment: VariableScope;
      emailProvider?: EmailProviderType;
      variables: Record<string, string>;
      sessionId?: string;
    }) => environmentApi.saveAndTest(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: environmentKeys.project(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: environmentKeys.pending(projectId),
      });
    },
  });
}

export function useTestIntegration(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TestIntegrationRequest) =>
      environmentApi.testIntegration(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: environmentKeys.project(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: environmentKeys.pending(projectId),
      });
    },
  });
}

export function useRunPreflight(projectId: string) {
  return useMutation({
    mutationFn: (targetEnvironment: "development" | "preview" | "production") =>
      environmentApi.runPreflight(projectId, targetEnvironment),
  });
}

export function useSyncVercelEnv(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetEnvironment: "development" | "preview" | "production") =>
      environmentApi.syncVercel(projectId, targetEnvironment),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: environmentKeys.project(projectId),
      });
    },
  });
}
