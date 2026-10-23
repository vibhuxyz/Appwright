import { z } from "zod";

export const databaseFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  unique: z.boolean(),
  indexed: z.boolean(),
  description: z.string().optional(),
});
export type DatabaseField = z.infer<typeof databaseFieldSchema>;

export const databaseIndexSchema = z.object({
  name: z.string(),
  keys: z.record(z.string(), z.number()),
  unique: z.boolean(),
  sparse: z.boolean().optional(),
});
export type DatabaseIndex = z.infer<typeof databaseIndexSchema>;

export const databaseCollectionSchema = z.object({
  name: z.string(),
  documentCount: z.number(),
  fields: z.array(databaseFieldSchema),
  indexes: z.array(databaseIndexSchema),
});
export type DatabaseCollection = z.infer<typeof databaseCollectionSchema>;

export const databaseOverviewResponseSchema = z.object({
  projectId: z.string(),
  databaseName: z.string().nullable(),
  status: z.enum(["pending", "provisioning", "ready", "failed", "pending_delete"]),
  environment: z.enum(["development", "preview", "production"]).nullable(),
  provider: z.enum(["mongodb"]),
  collections: z.array(databaseCollectionSchema),
  totalDocuments: z.number(),
  totalIndexes: z.number(),
});
export type DatabaseOverviewResponse = z.infer<typeof databaseOverviewResponseSchema>;

export const databaseDocumentsResponseSchema = z.object({
  items: z.array(z.record(z.string(), z.unknown())),
  total: z.number(),
  limit: z.number(),
  skip: z.number(),
});
export type DatabaseDocumentsResponse = z.infer<typeof databaseDocumentsResponseSchema>;
