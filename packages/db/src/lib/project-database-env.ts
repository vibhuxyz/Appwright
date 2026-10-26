import { decryptSecret } from "./crypto";
import { resolveProjectRuntimeEnvVars } from "./environment-registry";
import { prisma } from "./prisma";
import { ProjectDatabaseError } from "./project-database-errors";
import { projectDatabaseSecretKey } from "./provision-project-database";
import type { ProjectDbEnvironment } from "./project-db";

export async function getProjectRuntimeMongoUri(input: {
  projectId: string;
  environment: ProjectDbEnvironment;
}): Promise<string> {
  const prismaEnv =
    input.environment === "development"
      ? "DEVELOPMENT"
      : input.environment === "preview"
        ? "PREVIEW"
        : "PRODUCTION";

  const row = await prisma.projectDatabase.findUnique({
    where: {
      projectId_environment: {
        projectId: input.projectId,
        environment: prismaEnv,
      },
    },
    select: { status: true, secretRef: true },
  });
  if (!row || row.status !== "READY" || !row.secretRef) {
    throw ProjectDatabaseError.notReady();
  }

  const secret = await prisma.secret.findFirst({
    where: {
      projectId: input.projectId,
      key: projectDatabaseSecretKey(input.environment),
    },
    select: { encryptedValue: true },
  });
  if (!secret) throw ProjectDatabaseError.notReady();
  return decryptSecret(secret.encryptedValue);
}

export async function getProjectRuntimeEnv(input: {
  projectId: string;
  environment: ProjectDbEnvironment;
}): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  try {
    const uri = await getProjectRuntimeMongoUri(input);
    result.MONGODB_URI = uri;
  } catch (err) {
    if (!(err instanceof ProjectDatabaseError && err.code === "NOT_READY")) {
      throw err;
    }
  }

  const additionalVars = await resolveProjectRuntimeEnvVars(input);
  return { ...result, ...additionalVars };
}

export async function tryGetProjectRuntimeEnv(input: {
  projectId: string;
  environment: ProjectDbEnvironment;
}): Promise<Record<string, string>> {
  try {
    return await getProjectRuntimeEnv(input);
  } catch (err) {
    if (err instanceof ProjectDatabaseError && err.code === "NOT_READY") {
      return {};
    }
    throw err;
  }
}
