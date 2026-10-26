import {
  VariableScopeSchema,
  type DependencyManifest,
  type EnvironmentOverviewResponse,
  type IntegrationEnvironment,
  type ProjectEnvironmentVariableResponse,
} from "@repo/contracts";
import type { ProjectDatabaseEnvironment } from "../../generated/prisma/client";
import {
  deriveDatabaseSource,
  selectVariablesForEnvironment,
  toIntegrationViews,
  type SkippedIntegration,
} from "../environment-view";
import { decryptSecret } from "./crypto";
import { prisma } from "./prisma";
import { maskSecretValue } from "./secret-mask";

const SHARED_SCOPE = "all";
const DATABASE_ENVIRONMENT = {
  development: "DEVELOPMENT",
  preview: "PREVIEW",
  production: "PRODUCTION",
} as const satisfies Record<IntegrationEnvironment, ProjectDatabaseEnvironment>;

export interface EnvironmentOverviewResult {
  overview: EnvironmentOverviewResponse;
  skipped: SkippedIntegration[];
}

async function loadVariables(
  projectId: string,
  environment: IntegrationEnvironment,
): Promise<ProjectEnvironmentVariableResponse[]> {
  const rows = await prisma.projectEnvironmentVariable.findMany({
    where: { projectId, environment: { in: [environment, SHARED_SCOPE] } },
    orderBy: [{ key: "asc" }, { environment: "asc" }],
  });
  const secretIds = rows.flatMap((row) => (row.isSecret && row.secretRef !== null ? [row.secretRef] : []));
  const secrets = secretIds.length > 0
    ? await prisma.secret.findMany({ where: { id: { in: secretIds } }, select: { id: true, encryptedValue: true } })
    : [];
  const secretsById = new Map(secrets.map((secret) => [secret.id, secret.encryptedValue]));
  return rows.flatMap((row) => {
    const scope = VariableScopeSchema.safeParse(row.environment);
    if (!scope.success) return [];
    const encrypted = row.secretRef === null ? undefined : secretsById.get(row.secretRef);
    const maskedValue = row.isSecret
      ? encrypted ? maskSecretValue(decryptSecret(encrypted)) : null
      : row.value;
    return [{
      id: row.id,
      projectId: row.projectId,
      environment: scope.data,
      key: row.key,
      value: row.isSecret ? null : row.value,
      isSecret: row.isSecret,
      maskedValue,
      required: row.required,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }];
  });
}

async function loadProject(projectId: string) {
  return prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: {
      vercelProjectId: true,
      user: { select: { vercelConnection: { select: { teamId: true } } } },
      sessions: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          blueprints: { take: 1, orderBy: { blueprintVersion: "desc" }, select: { dependencyManifest: true } },
        },
      },
    },
  });
}

async function loadIntegrations(projectId: string) {
  return prisma.projectIntegration.findMany({
    where: { projectId },
    select: {
      provider: true,
      required: true,
      environments: {
        select: { environment: true, credentialMode: true, status: true, lastTestedAt: true, lastError: true },
      },
    },
  });
}

export async function getEnvironmentOverview(input: {
  projectId: string;
  environment: IntegrationEnvironment;
}): Promise<EnvironmentOverviewResult> {
  const { projectId, environment } = input;
  const [project, integrations, rawVariables, projectDatabase] = await Promise.all([
    loadProject(projectId),
    loadIntegrations(projectId),
    loadVariables(projectId, environment),
    prisma.projectDatabase.findUnique({
      where: { projectId_environment: { projectId, environment: DATABASE_ENVIRONMENT[environment] } },
      select: { status: true, databaseName: true },
    }),
  ]);
  const variables = selectVariablesForEnvironment(rawVariables, environment);
  const database = deriveDatabaseSource({
    needsDatabase: integrations.some((item) => item.provider === "mongodb" && item.required),
    projectDatabase,
    hasOwnUri: variables.some((variable) => variable.key === "MONGODB_URI" && variable.maskedValue !== null),
  });
  const views = toIntegrationViews({ integrations, environment, database });
  const rawManifest = project.sessions[0]?.blueprints[0]?.dependencyManifest;
  return {
    overview: {
      projectId,
      environment,
      manifest: rawManifest ? (rawManifest as DependencyManifest) : null,
      integrations: views.items,
      variables,
      database,
      vercel: {
        connected: Boolean(project.user.vercelConnection),
        vercelProjectId: project.vercelProjectId,
        teamId: project.user.vercelConnection?.teamId ?? null,
      },
    },
    skipped: views.skipped,
  };
}
