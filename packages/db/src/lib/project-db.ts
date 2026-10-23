import type { Collection, Db, Document } from "mongodb";
import { getMongoClient } from "./mongo-client";

const PROJECT_ID_PATTERN = /^[a-z0-9]{1,30}$/;
const PROJECT_DB_PREFIX = "app_";

/** Atlas M0 / shared-tier logical database names are capped at 38 UTF-8 bytes. */
export const ATLAS_SHARED_TIER_DB_NAME_MAX_BYTES = 38;

export const PROJECT_DB_ENVIRONMENTS = [
  "development",
  "preview",
  "production",
] as const;
export type ProjectDbEnvironment = (typeof PROJECT_DB_ENVIRONMENTS)[number];

const ENV_PATTERN = /^(development|preview|production)$/;

const ENV_DB_SUFFIX = {
  development: "d",
  preview: "v",
  production: "p",
} as const satisfies Record<ProjectDbEnvironment, string>;

export function toProjectDatabaseName(
  projectId: string,
  environment: ProjectDbEnvironment = "development",
): string {
  if (!PROJECT_ID_PATTERN.test(projectId)) {
    throw new Error(`Invalid projectId for database scoping: "${projectId}"`);
  }
  if (!ENV_PATTERN.test(environment)) {
    throw new Error(`Invalid database environment: "${environment}"`);
  }
  const name = `${PROJECT_DB_PREFIX}${projectId}_${ENV_DB_SUFFIX[environment]}`;
  if (new TextEncoder().encode(name).length > ATLAS_SHARED_TIER_DB_NAME_MAX_BYTES) {
    throw new Error(
      `Database name exceeds Atlas ${ATLAS_SHARED_TIER_DB_NAME_MAX_BYTES}-byte limit: "${name}"`,
    );
  }
  return name;
}

export function toProjectDatabaseUsername(
  projectId: string,
  environment: ProjectDbEnvironment,
): string {
  if (!PROJECT_ID_PATTERN.test(projectId)) {
    throw new Error(`Invalid projectId for database user: "${projectId}"`);
  }
  if (!ENV_PATTERN.test(environment)) {
    throw new Error(`Invalid database environment: "${environment}"`);
  }
  const shortEnv =
    environment === "development"
      ? "dev"
      : environment === "preview"
        ? "prev"
        : "prod";
  return `u_${projectId}_${shortEnv}`;
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

export function getProjectDb(
  projectId: string,
  environment: ProjectDbEnvironment = "development",
): ScopedProjectDb {
  const databaseName = toProjectDatabaseName(projectId, environment);
  const db = getMongoClient().db(databaseName);
  return new ScopedProjectDb(db);
}
