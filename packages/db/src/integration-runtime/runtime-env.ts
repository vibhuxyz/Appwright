import type { IntegrationEnvironment } from "@repo/contracts";
import { tryGetProjectRuntimeEnv } from "../lib/project-database-env";
import { buildIntegrationGatewayEnv } from "./gateway-env";

export async function resolveSandboxRuntimeEnv(input: {
  projectId: string;
  environment: IntegrationEnvironment;
  gatewayApiUrl: string;
}): Promise<Record<string, string>> {
  const [runtimeEnv, gatewayEnv] = await Promise.all([
    tryGetProjectRuntimeEnv({ projectId: input.projectId, environment: input.environment }),
    buildIntegrationGatewayEnv({
      projectId: input.projectId,
      environment: input.environment,
      apiUrl: input.gatewayApiUrl,
    }),
  ]);
  return { ...runtimeEnv, ...gatewayEnv };
}
