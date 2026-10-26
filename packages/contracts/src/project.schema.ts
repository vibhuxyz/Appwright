import z from "zod";
import { IntegrationProviderSchema } from "./environment";

export const ProjectStarterSchema = z.enum([
  "blank",
  "saas",
  "ai-chat",
  "ecommerce",
  "blog-cms",
  "pm",
]);

export const ProjectStatus = z.enum([
  "PROVISIONING",
  "BUILDING",
  "READY",
  "ERROR",
]);

export const CreateProjectRequest = z.object({
  name: z.string().min(1),
  templateId: z.literal("nextjs-fullstack").default("nextjs-fullstack"),
  starterId: ProjectStarterSchema.nullable().optional(),
  integrations: z.array(IntegrationProviderSchema).max(5).default([]),
});

export const ProjectResponse = z.object({
  id: z.string(),
  name: z.string(),
  templateId: z.string(),
  starterId: z.string().nullable(),
  status: ProjectStatus,
  previewUrl: z.string().nullable(),
  hasProductionDeployment: z.boolean(),
  createdAt: z.string(),
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequest>;
export type ProjectResponse = z.infer<typeof ProjectResponse>;

export const ProjectOverviewCommitSchema = z.object({
  sha: z.string(),
  shortSha: z.string(),
  message: z.string(),
  author: z.string(),
  date: z.string(),
});
export type ProjectOverviewCommit = z.infer<typeof ProjectOverviewCommitSchema>;

export const ProjectOverviewActivitySchema = z.object({
  id: z.string(),
  type: z.enum(["project", "database", "session", "asset", "commit", "deployment"]),
  title: z.string(),
  desc: z.string(),
  timestamp: z.string(),
});
export type ProjectOverviewActivity = z.infer<typeof ProjectOverviewActivitySchema>;

export const ProjectOverviewDatabaseSchema = z.object({
  status: z.string(),
  databaseName: z.string().nullable(),
  environment: z.string().nullable(),
  provider: z.string(),
});
export type ProjectOverviewDatabase = z.infer<typeof ProjectOverviewDatabaseSchema>;

export const ProjectOverviewMetricsSchema = z.object({
  fileCount: z.number(),
  sessionCount: z.number(),
  messageCount: z.number(),
  totalTokens: z.number(),
  totalCostUsd: z.number(),
  assetCount: z.number(),
});
export type ProjectOverviewMetrics = z.infer<typeof ProjectOverviewMetricsSchema>;

export const ProjectOverviewHealthSchema = z.object({
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
export type ProjectOverviewHealth = z.infer<typeof ProjectOverviewHealthSchema>;

export const ProjectOverviewResponse = z.object({
  projectId: z.string(),
  projectName: z.string(),
  templateId: z.string(),
  status: ProjectStatus,
  previewUrl: z.string().nullable(),
  metrics: ProjectOverviewMetricsSchema,
  database: ProjectOverviewDatabaseSchema.nullable(),
  health: ProjectOverviewHealthSchema,
  recentCommits: z.array(ProjectOverviewCommitSchema),
  recentActivity: z.array(ProjectOverviewActivitySchema),
});
export type ProjectOverviewResponse = z.infer<typeof ProjectOverviewResponse>;

