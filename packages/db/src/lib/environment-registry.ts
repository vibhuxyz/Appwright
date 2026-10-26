import type { DependencyManifest } from "@repo/contracts";
import { decryptSecret } from "./crypto";
import { prisma } from "./prisma";
import { environmentSecretKey, writeProjectEnvironmentVariable } from "../secrets";
export { getEnvironmentOverview } from "./environment-overview";

export async function syncManifestToRegistry(
  projectId: string,
  manifest: DependencyManifest,
): Promise<void> {
  const integrationConfigs = [
    { provider: "mongodb", required: manifest.database.required },
    { provider: "auth", required: manifest.auth.required },
    { provider: "cloudinary", required: manifest.storage.required },
    { provider: "email", required: manifest.email.required },
    { provider: "realtime", required: manifest.realtime.required },
    { provider: "razorpay", required: manifest.externalApis.some((api) => api.name === "razorpay" && api.required) },
    { provider: "google-oauth", required: manifest.auth.required && manifest.auth.features.includes("google-oauth") },
  ];

  for (const item of integrationConfigs) {
    const existing = await prisma.projectIntegration.findUnique({
      where: {
        projectId_provider: { projectId, provider: item.provider },
      },
    });

    const status = existing
      ? existing.status
      : item.required
        ? "missing"
        : "not_required";

    await prisma.projectIntegration.upsert({
      where: {
        projectId_provider: { projectId, provider: item.provider },
      },
      create: {
        projectId,
        provider: item.provider,
        required: item.required,
        status,
      },
      update: {
        required: item.required,
        ...(existing?.status === "not_required" && item.required
          ? { status: "missing" }
          : {}),
      },
    });
  }

  for (const v of manifest.envVars) {
    for (const scope of v.scopes) {
      await prisma.projectEnvironmentVariable.upsert({
        where: {
          projectId_environment_key: {
            projectId,
            environment: scope,
            key: v.key,
          },
        },
        create: {
          projectId,
          environment: scope,
          key: v.key,
          isSecret: v.isSecret,
          required: v.required,
          description: v.description,
        },
        update: {
          isSecret: v.isSecret,
          required: v.required,
          description: v.description,
        },
      });
    }
  }
}

export async function setProjectEnvironmentVariable(input: {
  projectId: string;
  environment: string;
  key: string;
  value: string;
  isSecret?: boolean;
  description?: string;
}): Promise<void> {
  const { projectId, environment, key, value, isSecret = false, description } = input;

  await prisma.$transaction(async (transaction) => {
    await writeProjectEnvironmentVariable(transaction, {
      projectId,
      environment,
      key,
      value,
      isSecret,
      description,
    });
  });
}

export async function deleteProjectEnvironmentVariable(input: {
  projectId: string;
  environment: string;
  key: string;
}): Promise<void> {
  const { projectId, environment, key } = input;
  const sKey = environmentSecretKey(environment, key);
  await prisma.$transaction([
    prisma.projectEnvironmentVariable.deleteMany({
      where: { projectId, environment, key },
    }),
    prisma.secret.deleteMany({ where: { projectId, key: sKey } }),
  ]);
}

export async function resolveProjectRuntimeEnvVars(input: {
  projectId: string;
  environment: "development" | "preview" | "production";
}): Promise<Record<string, string>> {
  const rows = await prisma.projectEnvironmentVariable.findMany({
    where: {
      projectId: input.projectId,
      environment: { in: ["all", input.environment] },
    },
    orderBy: { environment: "asc" },
  });

  const secretIds = rows.flatMap((row) =>
    row.isSecret && row.secretRef !== null ? [row.secretRef] : [],
  );
  const secrets = secretIds.length > 0
    ? await prisma.secret.findMany({ where: { id: { in: secretIds } } })
    : [];
  const secretsById = new Map(secrets.map((secret) => [secret.id, secret]));

  const envRecord: Record<string, string> = {};
  for (const row of rows) {
    if (row.isSecret) {
      const secret = row.secretRef === null ? undefined : secretsById.get(row.secretRef);
      if (secret) {
        envRecord[row.key] = decryptSecret(secret.encryptedValue);
      }
    } else if (row.value !== null) {
      envRecord[row.key] = row.value;
    }
  }

  return envRecord;
}
