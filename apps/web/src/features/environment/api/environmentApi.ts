import {
  EnvironmentOverviewResponse,
  IntegrationCatalogResponseSchema,
  IntegrationConfigurationRequestSchema,
  IntegrationConfigurationResponseSchema,
  PendingIntegrationRequirementListSchema,
  PreflightCheckResponse,
  SendTestEmailResponse,
  SyncVercelEnvResponse,
  TestIntegrationResponse,
  type DeleteEnvironmentVariableRequest,
  type EmailProviderType,
  type IntegrationConfigurationRequest,
  type IntegrationEnvironment,
  type IntegrationCatalogResponse,
  type PendingIntegrationRequirement,
  type SendTestEmailRequestType,
  type SetEmailProviderRequestType,
  type SetEnvironmentVariableRequest,
  type TestIntegrationRequest,
  type VariableScope,
} from "@repo/contracts";
import { httpClient } from "@/shared/lib/httpClient";

export const environmentApi = {
  getIntegrationCatalog: (
    projectId: string,
    signal?: AbortSignal,
  ): Promise<IntegrationCatalogResponse> =>
    httpClient
      .get(`/v1/projects/${encodeURIComponent(projectId)}/integrations`, signal)
      .then((response) => IntegrationCatalogResponseSchema.parse(response)),

  configureIntegration: (
    projectId: string,
    input: IntegrationConfigurationRequest,
  ) =>
    httpClient
      .post(
        `/v1/projects/${encodeURIComponent(projectId)}/integrations/configure`,
        IntegrationConfigurationRequestSchema.parse(input),
      )
      .then((response) => IntegrationConfigurationResponseSchema.parse(response)),

  disconnectIntegration: (
    projectId: string,
    provider: string,
    environment: string,
  ): Promise<void> => {
    const query = new URLSearchParams({ environment });
    return httpClient.delete(
      `/v1/projects/${encodeURIComponent(projectId)}/integrations/${encodeURIComponent(provider)}?${query}`,
    );
  },

  getOverview: (
    projectId: string,
    environment: IntegrationEnvironment,
    signal?: AbortSignal,
  ): Promise<EnvironmentOverviewResponse> => {
    const query = new URLSearchParams({ environment });
    return httpClient
      .get(`/v1/projects/${encodeURIComponent(projectId)}/environment?${query}`, signal)
      .then((res) => EnvironmentOverviewResponse.parse(res));
  },

  setVariable: (
    projectId: string,
    input: SetEnvironmentVariableRequest,
  ): Promise<{ ok: boolean }> =>
    httpClient.post<{ ok: boolean }>(
      `/v1/projects/${encodeURIComponent(projectId)}/environment/variables`,
      input,
    ),

  deleteVariable: (
    projectId: string,
    input: DeleteEnvironmentVariableRequest,
  ): Promise<void> => {
    const qs = new URLSearchParams({
      environment: input.environment,
      key: input.key,
    }).toString();
    return httpClient.delete(
      `/v1/projects/${encodeURIComponent(projectId)}/environment/variables?${qs}`,
    );
  },

  testIntegration: (
    projectId: string,
    input: TestIntegrationRequest,
  ): Promise<TestIntegrationResponse> =>
    httpClient
      .post(
        `/v1/projects/${encodeURIComponent(projectId)}/environment/test-integration`,
        input,
      )
      .then((res) => TestIntegrationResponse.parse(res)),

  setEmailProvider: (
    projectId: string,
    input: SetEmailProviderRequestType,
  ): Promise<{ ok: boolean; activeProvider: string }> =>
    httpClient.post(
      `/v1/projects/${encodeURIComponent(projectId)}/environment/email-provider`,
      input,
    ),

  sendTestEmail: (
    projectId: string,
    input: SendTestEmailRequestType,
  ): Promise<SendTestEmailResponse> =>
    httpClient
      .post(
        `/v1/projects/${encodeURIComponent(projectId)}/environment/send-test-email`,
        input,
      )
      .then((res) => SendTestEmailResponse.parse(res)),

  getPendingIntegrationRequests: (
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<PendingIntegrationRequirement[]> =>
    httpClient
      .get(`/v1/sessions/${encodeURIComponent(sessionId)}/integration-requests`, signal)
      .then((res) => PendingIntegrationRequirementListSchema.parse(res).items),

  saveAndTest: (
    projectId: string,
    input: {
      provider: string;
      environment: VariableScope;
      emailProvider?: EmailProviderType;
      variables: Record<string, string>;
      sessionId?: string;
    },
  ): Promise<{ ok: boolean; status: string; message: string }> =>
    httpClient.post(
      `/v1/projects/${encodeURIComponent(projectId)}/environment/save-and-test`,
      input,
    ),

  runPreflight: (
    projectId: string,
    targetEnvironment: "development" | "preview" | "production",
  ): Promise<PreflightCheckResponse> =>
    httpClient
      .post(
        `/v1/projects/${encodeURIComponent(projectId)}/environment/preflight`,
        { targetEnvironment },
      )
      .then((res) => PreflightCheckResponse.parse(res)),

  syncVercel: (
    projectId: string,
    targetEnvironment: "development" | "preview" | "production",
  ): Promise<SyncVercelEnvResponse> =>
    httpClient
      .post(
        `/v1/projects/${encodeURIComponent(projectId)}/environment/sync-vercel`,
        { targetEnvironment },
      )
      .then((res) => SyncVercelEnvResponse.parse(res)),
};
