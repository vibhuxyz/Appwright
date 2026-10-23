import type { ProjectDatabaseResponse } from "@repo/contracts";
import type { ProjectDatabase } from "@repo/db";

function environmentOf(
  value: ProjectDatabase["environment"],
): ProjectDatabaseResponse["environment"] {
  if (value === "DEVELOPMENT") return "development";
  if (value === "PREVIEW") return "preview";
  return "production";
}

function statusOf(
  value: ProjectDatabase["status"],
): ProjectDatabaseResponse["status"] {
  if (value === "PENDING") return "pending";
  if (value === "PROVISIONING") return "provisioning";
  if (value === "READY") return "ready";
  if (value === "FAILED") return "failed";
  return "pending_delete";
}

export function serializeProjectDatabase(
  row: ProjectDatabase,
): ProjectDatabaseResponse {
  return {
    projectId: row.projectId,
    environment: environmentOf(row.environment),
    provider: "mongodb",
    databaseName: row.databaseName,
    isolationMode:
      row.isolationMode === "SCOPED_USER"
        ? "scoped-user"
        : "shared-cluster-user",
    status: statusOf(row.status),
    migrationVersion: row.migrationVersion,
    lastErrorCode: row.lastErrorCode,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
