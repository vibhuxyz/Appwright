import { REQUESTABLE_INTEGRATION_PROVIDERS } from "@repo/contracts";
import { prisma } from "../lib/prisma";

const DEVELOPMENT = "development";

export interface DevelopmentIntegrationState {
  provider: string;
  required: boolean;
  status: string | undefined;
  credentialMode: string | undefined;
  lastError: string | null;
}

export async function loadDevelopmentStates(input: {
  projectId: string;
  providers?: readonly string[];
}): Promise<Map<string, DevelopmentIntegrationState>> {
  const integrations = await prisma.projectIntegration.findMany({
    where: {
      projectId: input.projectId,
      provider: { in: [...(input.providers ?? REQUESTABLE_INTEGRATION_PROVIDERS)] },
    },
    select: {
      provider: true,
      required: true,
      environments: {
        where: { environment: DEVELOPMENT },
        select: { status: true, credentialMode: true, lastError: true },
      },
    },
  });
  return new Map(integrations.map((integration) => {
    const development = integration.environments[0];
    return [integration.provider, {
      provider: integration.provider,
      required: integration.required,
      status: development?.status,
      credentialMode: development?.credentialMode,
      lastError: development?.lastError ?? null,
    }];
  }));
}
