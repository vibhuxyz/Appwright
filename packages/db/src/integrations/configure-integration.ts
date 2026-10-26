import {
  integrationCredentialKeys,
  isSecretCredentialKey,
  type ConfigurableIntegrationProvider,
  type CredentialMode,
  type IntegrationEnvironment,
} from "@repo/contracts";
import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { environmentSecretKey, writeProjectEnvironmentVariable } from "../secrets";

const EMAIL_PROVIDER = "brevo";

function integrationConfig(
  provider: ConfigurableIntegrationProvider,
  existing: unknown,
  environment: IntegrationEnvironment,
  credentialMode: CredentialMode,
): Record<string, unknown> {
  const config = typeof existing === "object" && existing !== null && !Array.isArray(existing)
    ? existing as Record<string, unknown>
    : {};
  const environmentSettings = typeof config.environments === "object" &&
    config.environments !== null && !Array.isArray(config.environments)
    ? config.environments as Record<string, unknown>
    : {};

  const shouldSetActiveEmailProvider = provider === "email" && typeof config.activeProvider !== "string";
  return {
    ...config,
    ...(shouldSetActiveEmailProvider ? { activeProvider: EMAIL_PROVIDER } : {}),
    environments: {
      ...environmentSettings,
      [environment]: {
        ...(provider === "email" ? { provider: EMAIL_PROVIDER } : {}),
        credentialMode,
      },
    },
  };
}

export async function saveIntegrationConfiguration(input: {
  projectId: string;
  actorUserId: string;
  provider: ConfigurableIntegrationProvider;
  environment: IntegrationEnvironment;
  credentialMode: CredentialMode;
  values: Record<string, string>;
}): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const existing = await transaction.projectIntegration.findUnique({
      where: { projectId_provider: { projectId: input.projectId, provider: input.provider } },
      select: { id: true, config: true, required: true },
    });
    const config = integrationConfig(
      input.provider,
      existing?.config,
      input.environment,
      input.credentialMode,
    );
    const integration = await transaction.projectIntegration.upsert({
      where: { projectId_provider: { projectId: input.projectId, provider: input.provider } },
      create: {
        projectId: input.projectId,
        provider: input.provider,
        status: "testing",
        required: existing?.required ?? false,
        config: config as Prisma.InputJsonObject,
      },
      update: {
        status: "testing",
        config: config as Prisma.InputJsonObject,
        lastError: null,
      },
      select: { id: true },
    });

    await transaction.projectIntegrationEnvironment.upsert({
      where: {
        integrationId_environment: {
          integrationId: integration.id,
          environment: input.environment,
        },
      },
      create: {
        integrationId: integration.id,
        environment: input.environment,
        credentialMode: input.credentialMode,
        status: "testing",
      },
      update: {
        credentialMode: input.credentialMode,
        status: "testing",
        lastError: null,
      },
    });

    const credentialKeys = integrationCredentialKeys(input.provider);
    if (input.credentialMode === "APPWRITE_MANAGED") {
      await Promise.all([
        transaction.projectEnvironmentVariable.deleteMany({
          where: {
            projectId: input.projectId,
            environment: input.environment,
            key: { in: [...credentialKeys] },
          },
        }),
        transaction.secret.deleteMany({
          where: {
            projectId: input.projectId,
            key: {
              in: credentialKeys.map((key) => environmentSecretKey(input.environment, key)),
            },
          },
        }),
      ]);
    }

    await Promise.all(Object.entries(input.values).map(([key, value]) =>
      writeProjectEnvironmentVariable(transaction, {
        projectId: input.projectId,
        environment: input.environment,
        key,
        value,
        isSecret: isSecretCredentialKey(key),
      }),
    ));
    await transaction.integrationAuditEvent.create({
      data: {
        projectId: input.projectId,
        actorUserId: input.actorUserId,
        provider: input.provider,
        environment: input.environment,
        action: "configuration_saved",
        status: "testing",
      },
    });
  });
}
