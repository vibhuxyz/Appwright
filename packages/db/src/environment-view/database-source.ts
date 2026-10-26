import type { DatabaseSource } from "@repo/contracts";
import type { ProjectDatabaseRecord } from "./types";

const READY_DATABASE_STATUS = "READY";

export function deriveDatabaseSource(input: {
  needsDatabase: boolean;
  projectDatabase: ProjectDatabaseRecord | null;
  hasOwnUri: boolean;
}): DatabaseSource {
  if (input.hasOwnUri) return { source: "BYOK", databaseName: null };
  if (input.projectDatabase?.status === READY_DATABASE_STATUS) {
    return { source: "APPWRIGHT", databaseName: input.projectDatabase.databaseName };
  }
  if (input.needsDatabase) return { source: "NOT_PROVISIONED", databaseName: null };
  return { source: "NOT_REQUIRED", databaseName: null };
}
