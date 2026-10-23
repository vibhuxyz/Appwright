import z from "zod";

export const ProjectDatabaseEnvironment = z.enum([
  "development",
  "preview",
  "production",
]);
export type ProjectDatabaseEnvironment = z.infer<
  typeof ProjectDatabaseEnvironment
>;

export const ProjectDatabaseStatus = z.enum([
  "pending",
  "provisioning",
  "ready",
  "failed",
  "pending_delete",
]);
export type ProjectDatabaseStatus = z.infer<typeof ProjectDatabaseStatus>;

export const ProjectDatabaseIsolation = z.enum([
  "scoped-user",
  "shared-cluster-user",
]);
export type ProjectDatabaseIsolation = z.infer<typeof ProjectDatabaseIsolation>;

export const ProjectDatabaseProvider = z.enum(["mongodb"]);
export type ProjectDatabaseProvider = z.infer<typeof ProjectDatabaseProvider>;

export const DATABASE_BACKED_TEMPLATES = ["nextjs-fullstack"] as const;

export function templateNeedsDatabase(templateId: string): boolean {
  return (DATABASE_BACKED_TEMPLATES as readonly string[]).includes(templateId);
}

export const ProjectDatabaseResponse = z.object({
  projectId: z.string(),
  environment: ProjectDatabaseEnvironment,
  provider: ProjectDatabaseProvider,
  databaseName: z.string(),
  isolationMode: ProjectDatabaseIsolation,
  status: ProjectDatabaseStatus,
  migrationVersion: z.number().int().nonnegative(),
  lastErrorCode: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProjectDatabaseResponse = z.infer<typeof ProjectDatabaseResponse>;

export const ProjectDatabaseListResponse = z.object({
  items: z.array(ProjectDatabaseResponse),
});
export type ProjectDatabaseListResponse = z.infer<
  typeof ProjectDatabaseListResponse
>;

export const RetryProjectDatabaseRequest = z.object({
  environment: ProjectDatabaseEnvironment.default("development"),
});
export type RetryProjectDatabaseRequest = z.infer<
  typeof RetryProjectDatabaseRequest
>;

export const DatabaseFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  unique: z.boolean(),
  indexed: z.boolean(),
  description: z.string().optional(),
});
export type DatabaseField = z.infer<typeof DatabaseFieldSchema>;

export const DatabaseIndexSchema = z.object({
  name: z.string(),
  keys: z.record(z.string(), z.number()),
  unique: z.boolean(),
  sparse: z.boolean().optional(),
});
export type DatabaseIndex = z.infer<typeof DatabaseIndexSchema>;

export const DatabaseCollectionSchema = z.object({
  name: z.string(),
  documentCount: z.number(),
  fields: z.array(DatabaseFieldSchema),
  indexes: z.array(DatabaseIndexSchema),
});
export type DatabaseCollection = z.infer<typeof DatabaseCollectionSchema>;

export const DatabaseOverviewResponse = z.object({
  projectId: z.string(),
  databaseName: z.string().nullable(),
  status: ProjectDatabaseStatus,
  environment: ProjectDatabaseEnvironment.nullable(),
  provider: ProjectDatabaseProvider,
  collections: z.array(DatabaseCollectionSchema),
  totalDocuments: z.number(),
  totalIndexes: z.number(),
});
export type DatabaseOverviewResponse = z.infer<typeof DatabaseOverviewResponse>;

export const DatabaseDocumentsResponse = z.object({
  items: z.array(z.record(z.string(), z.unknown())),
  total: z.number(),
  limit: z.number(),
  skip: z.number(),
});
export type DatabaseDocumentsResponse = z.infer<typeof DatabaseDocumentsResponse>;

