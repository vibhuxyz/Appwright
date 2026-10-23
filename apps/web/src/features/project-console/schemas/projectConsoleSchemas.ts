import { z } from "zod";

export const projectOverviewCommitSchema = z.object({
  sha: z.string(),
  shortSha: z.string(),
  message: z.string(),
  author: z.string(),
  date: z.string(),
});
export type ProjectOverviewCommit = z.infer<typeof projectOverviewCommitSchema>;

export const projectOverviewActivitySchema = z.object({
  id: z.string(),
  type: z.enum(["project", "database", "session", "asset", "commit", "deployment"]),
  title: z.string(),
  desc: z.string(),
  timestamp: z.string(),
});
export type ProjectOverviewActivity = z.infer<typeof projectOverviewActivitySchema>;

export const projectOverviewDatabaseSchema = z.object({
  status: z.string(),
  databaseName: z.string().nullable(),
  environment: z.string().nullable(),
  provider: z.string(),
});
export type ProjectOverviewDatabase = z.infer<typeof projectOverviewDatabaseSchema>;

export const projectOverviewMetricsSchema = z.object({
  fileCount: z.number(),
  sessionCount: z.number(),
  messageCount: z.number(),
  totalTokens: z.number(),
  totalCostUsd: z.number(),
  assetCount: z.number(),
});
export type ProjectOverviewMetrics = z.infer<typeof projectOverviewMetricsSchema>;

export const projectOverviewHealthSchema = z.object({
  devServer: z.object({
    running: z.boolean(),
    port: z.number().nullable(),
    url: z.string().nullable(),
  }),
  database: z.object({
    status: z.string(),
    name: z.string().nullable(),
  }),
  overallStatus: z.enum(["healthy", "degraded", "provisioning"]),
});
export type ProjectOverviewHealth = z.infer<typeof projectOverviewHealthSchema>;

export const projectOverviewResponseSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  templateId: z.string(),
  status: z.enum(["PROVISIONING", "BUILDING", "READY", "ERROR"]),
  previewUrl: z.string().nullable(),
  metrics: projectOverviewMetricsSchema,
  database: projectOverviewDatabaseSchema.nullable(),
  health: projectOverviewHealthSchema,
  recentCommits: z.array(projectOverviewCommitSchema),
  recentActivity: z.array(projectOverviewActivitySchema),
});
export type ProjectOverviewResponse = z.infer<typeof projectOverviewResponseSchema>;
