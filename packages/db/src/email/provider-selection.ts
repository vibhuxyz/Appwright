import type { EmailProviderType, IntegrationEnvironment, VariableScope } from "@repo/contracts";
import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export async function setActiveEmailProvider(input: {
  projectId: string;
  environment: IntegrationEnvironment;
  provider: EmailProviderType;
}): Promise<void> {
  const { projectId, environment, provider } = input;

  const existing = await prisma.projectIntegration.findUnique({
    where: { projectId_provider: { projectId, provider: "email" } },
  });

  const configObj = asRecord(existing?.config);
  const envMap = asRecord(configObj.environments);
  const newConfig: Prisma.InputJsonObject = {
    ...configObj as Prisma.InputJsonObject,
    ...(typeof configObj.activeProvider === "string" ? {} : { activeProvider: provider }),
    environments: {
      ...envMap,
      [environment]: { ...asRecord(envMap[environment]) as Prisma.InputJsonObject, provider },
    } as Prisma.InputJsonObject,
  };

  await prisma.projectIntegration.upsert({
    where: { projectId_provider: { projectId, provider: "email" } },
    create: {
      projectId,
      provider: "email",
      status: "configured",
      required: existing?.required ?? false,
      config: newConfig,
    },
    update: {
      config: newConfig,
    },
  });
}

export async function getActiveEmailProvider(
  projectId: string,
  environment: VariableScope,
): Promise<EmailProviderType> {
  const existing = await prisma.projectIntegration.findUnique({
    where: { projectId_provider: { projectId, provider: "email" } },
  });

  const configObj = (existing?.config as Record<string, unknown>) ?? {};
  const envMap = (configObj.environments as Record<string, string>) ?? {};

  const rawEnvironmentConfig = envMap[environment];
  const envProvider = typeof rawEnvironmentConfig === "object" && rawEnvironmentConfig !== null
    ? (rawEnvironmentConfig as Record<string, unknown>).provider
    : rawEnvironmentConfig;
  if (envProvider && (envProvider === "resend" || envProvider === "brevo" || envProvider === "nodemailer")) {
    return envProvider;
  }

  const globalProvider = configObj.activeProvider as string;
  if (globalProvider && (globalProvider === "resend" || globalProvider === "brevo" || globalProvider === "nodemailer")) {
    return globalProvider;
  }

  return "brevo";
}
