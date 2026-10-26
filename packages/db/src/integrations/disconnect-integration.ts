import {
  integrationCredentialKeys,
  summarizeIntegrationStatus,
  type ConfigurableIntegrationProvider,
  type IntegrationEnvironment,
} from "@repo/contracts";
import { prisma } from "../lib/prisma";
import { environmentSecretKey } from "../secrets";

export async function disconnectIntegrationConfiguration(input: {
  projectId: string;
  actorUserId: string;
  provider: ConfigurableIntegrationProvider;
  environment: IntegrationEnvironment;
}): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const integration = await transaction.projectIntegration.findUnique({
      where: { projectId_provider: { projectId: input.projectId, provider: input.provider } },
      select: { id: true, required: true },
    });
    if (!integration) return;
    const keys = integrationCredentialKeys(input.provider);
    await Promise.all([
      transaction.projectEnvironmentVariable.deleteMany({
        where: { projectId: input.projectId, environment: input.environment, key: { in: [...keys] } },
      }),
      transaction.secret.deleteMany({
        where: { projectId: input.projectId, key: { in: keys.map((key) => environmentSecretKey(input.environment, key)) } },
      }),
      transaction.projectIntegrationEnvironment.updateMany({
        where: { integrationId: integration.id, environment: input.environment },
        data: { status: "configuration_required", lastError: null },
      }),
    ]);
    const environments = await transaction.projectIntegrationEnvironment.findMany({
      where: { integrationId: integration.id },
      select: { status: true },
    });
    const status = summarizeIntegrationStatus({
      environmentStatuses: environments.map((environment) => environment.status),
      required: integration.required,
    });
    await transaction.projectIntegration.update({
      where: { id: integration.id },
      data: { status, lastError: null },
    });
    await transaction.integrationAuditEvent.create({
      data: {
        projectId: input.projectId,
        actorUserId: input.actorUserId,
        provider: input.provider,
        environment: input.environment,
        action: "configuration_disconnected",
        status: "configuration_required",
      },
    });
  });
}
