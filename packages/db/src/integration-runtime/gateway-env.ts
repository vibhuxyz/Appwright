import type { IntegrationEnvironment } from "@repo/contracts";
import { prisma } from "../lib/prisma";
import { getProjectIntegrationToken } from "./project-access-token";

const CONNECTED_STATUS = "connected";

export async function buildIntegrationGatewayEnv(input: {
  projectId: string;
  environment: IntegrationEnvironment;
  apiUrl: string;
}): Promise<Record<string, string>> {
  const connectedCount = await prisma.projectIntegrationEnvironment.count({
    where: {
      environment: input.environment,
      status: CONNECTED_STATUS,
      integration: { projectId: input.projectId },
    },
  });
  if (connectedCount === 0) return {};
  return {
    APPWRITE_INTEGRATION_TOKEN: await getProjectIntegrationToken(input.projectId, input.environment),
    APPWRITE_API_URL: input.apiUrl,
    APPWRITE_INTEGRATION_ENVIRONMENT: input.environment,
  };
}
