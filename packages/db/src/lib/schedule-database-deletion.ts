import { prisma } from "./prisma";
import {
  toProjectDatabaseUsername,
  type ProjectDbEnvironment,
} from "./project-db";

const DEFAULT_RETENTION_DAYS = 7;

function retentionMs(): number {
  const raw = process.env.PROJECT_DATABASE_RETENTION_DAYS;
  const days = raw ? Number(raw) : DEFAULT_RETENTION_DAYS;
  const safe = Number.isFinite(days) && days >= 1 ? days : DEFAULT_RETENTION_DAYS;
  return safe * 24 * 60 * 60 * 1000;
}

function fromPrismaEnv(
  environment: "DEVELOPMENT" | "PREVIEW" | "PRODUCTION",
): ProjectDbEnvironment {
  if (environment === "DEVELOPMENT") return "development";
  if (environment === "PREVIEW") return "preview";
  return "production";
}

export async function scheduleProjectDatabaseDeletions(
  projectId: string,
): Promise<number> {
  const rows = await prisma.projectDatabase.findMany({
    where: { projectId },
    select: { databaseName: true, environment: true, projectId: true },
  });
  if (rows.length === 0) return 0;

  const deleteAfter = new Date(Date.now() + retentionMs());
  await prisma.$transaction(
    rows.map((row) =>
      prisma.databaseDeletion.upsert({
        where: { databaseName: row.databaseName },
        create: {
          databaseName: row.databaseName,
          username: toProjectDatabaseUsername(
            row.projectId,
            fromPrismaEnv(row.environment),
          ),
          provider: "MONGODB",
          projectId: row.projectId,
          environment: row.environment,
          deleteAfter,
          status: "scheduled",
        },
        update: {
          deleteAfter,
          status: "scheduled",
          lastErrorCode: null,
        },
      }),
    ),
  );
  return rows.length;
}
