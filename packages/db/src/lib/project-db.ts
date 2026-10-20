import type { Collection, Db, Document } from "mongodb";
import { getMongoClient } from "./mongo-client";

const PROJECT_ID_PATTERN = /^[a-z0-9]{1,30}$/;
const PROJECT_DB_PREFIX = "proj_";

export function toProjectDatabaseName(projectId: string): string {
  if (!PROJECT_ID_PATTERN.test(projectId)) {
    throw new Error(`Invalid projectId for database scoping: "${projectId}"`);
  }
  return `${PROJECT_DB_PREFIX}${projectId}`;
}

export class ScopedProjectDb {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  collection<T extends Document = Document>(name: string): Collection<T> {
    return this.db.collection<T>(name);
  }
}

export function getProjectDb(projectId: string): ScopedProjectDb {
  const databaseName = toProjectDatabaseName(projectId);
  const db = getMongoClient().db(databaseName);
  return new ScopedProjectDb(db);
}
