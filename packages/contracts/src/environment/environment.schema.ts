import { z } from "zod";
import { DependencyManifestSchema } from "../manifest";
import {
  CHECK_STATUSES,
  CREDENTIAL_SOURCES,
  DATABASE_SOURCES,
  INTEGRATION_ENVIRONMENTS,
  INTEGRATION_PROVIDERS,
  INTEGRATION_STATUSES,
  VARIABLE_SCOPES,
} from "./constants";

export const IntegrationProviderSchema = z.enum(INTEGRATION_PROVIDERS);
export type IntegrationProvider = z.infer<typeof IntegrationProviderSchema>;

export const IntegrationStatusSchema = z.enum(INTEGRATION_STATUSES);
export type IntegrationStatus = z.infer<typeof IntegrationStatusSchema>;

export const VariableScopeSchema = z.enum(VARIABLE_SCOPES);
export type VariableScope = z.infer<typeof VariableScopeSchema>;

export const CheckStatusSchema = z.enum(CHECK_STATUSES);
export type CheckStatus = z.infer<typeof CheckStatusSchema>;

export const ProjectIntegrationResponse = z.object({
  id: z.string(),
  projectId: z.string(),
  provider: IntegrationProviderSchema,
  status: IntegrationStatusSchema,
  required: z.boolean(),
  config: z.record(z.string(), z.unknown()).nullable(),
  lastTestedAt: z.string().nullable(),
  lastError: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProjectIntegrationResponse = z.infer<
  typeof ProjectIntegrationResponse
>;

export const ProjectEnvironmentVariableResponse = z.object({
  id: z.string(),
  projectId: z.string(),
  environment: VariableScopeSchema,
  key: z.string(),
  value: z.string().nullable(),
  isSecret: z.boolean(),
  maskedValue: z.string().nullable(),
  required: z.boolean(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProjectEnvironmentVariableResponse = z.infer<
  typeof ProjectEnvironmentVariableResponse
>;

export const EnvironmentOverviewQuerySchema = z.object({
  environment: z.enum(INTEGRATION_ENVIRONMENTS).default("development"),
});

export const CredentialSourceSchema = z.enum(CREDENTIAL_SOURCES);
export type CredentialSource = z.infer<typeof CredentialSourceSchema>;

export const EnvironmentIntegrationViewSchema = z.object({
  provider: IntegrationProviderSchema,
  required: z.boolean(),
  status: IntegrationStatusSchema,
  credentialSource: CredentialSourceSchema,
  lastTestedAt: z.string().nullable(),
  lastError: z.string().nullable(),
});
export type EnvironmentIntegrationView = z.infer<typeof EnvironmentIntegrationViewSchema>;

export const DatabaseSourceSchema = z.object({
  source: z.enum(DATABASE_SOURCES),
  databaseName: z.string().nullable(),
});
export type DatabaseSource = z.infer<typeof DatabaseSourceSchema>;

export const EnvironmentOverviewResponse = z.object({
  projectId: z.string(),
  environment: z.enum(INTEGRATION_ENVIRONMENTS),
  manifest: DependencyManifestSchema.nullable(),
  integrations: z.array(EnvironmentIntegrationViewSchema),
  variables: z.array(ProjectEnvironmentVariableResponse),
  database: DatabaseSourceSchema,
  vercel: z.object({
    connected: z.boolean(),
    vercelProjectId: z.string().nullable(),
    teamId: z.string().nullable(),
  }),
});
export type EnvironmentOverviewResponse = z.infer<
  typeof EnvironmentOverviewResponse
>;

export const SetEnvironmentVariableRequest = z.object({
  environment: VariableScopeSchema,
  key: z.string().min(1),
  value: z.string(),
  isSecret: z.boolean().default(false),
  description: z.string().optional(),
});
export type SetEnvironmentVariableRequest = z.infer<
  typeof SetEnvironmentVariableRequest
>;

export const DeleteEnvironmentVariableRequest = z.object({
  environment: VariableScopeSchema,
  key: z.string().min(1),
});
export type DeleteEnvironmentVariableRequest = z.infer<
  typeof DeleteEnvironmentVariableRequest
>;

export const TestIntegrationRequest = z.object({
  provider: IntegrationProviderSchema,
  environment: z.enum(["development", "preview", "production"]).default("development"),
});
export type TestIntegrationRequest = z.infer<typeof TestIntegrationRequest>;

export const TestIntegrationResponse = z.object({
  provider: IntegrationProviderSchema,
  status: IntegrationStatusSchema,
  message: z.string(),
  testedAt: z.string(),
});
export type TestIntegrationResponse = z.infer<typeof TestIntegrationResponse>;

export const PreflightCheckItemSchema = z.object({
  name: z.string(),
  status: CheckStatusSchema,
  message: z.string(),
});
export type PreflightCheckItem = z.infer<typeof PreflightCheckItemSchema>;

export const PreflightCheckResponse = z.object({
  ok: z.boolean(),
  targetEnvironment: z.enum(["development", "preview", "production"]),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  checks: z.array(PreflightCheckItemSchema),
});
export type PreflightCheckResponse = z.infer<typeof PreflightCheckResponse>;

export const SyncVercelEnvResponse = z.object({
  syncedCount: z.number().int().nonnegative(),
  keys: z.array(z.string()),
  target: z.string(),
});
export type SyncVercelEnvResponse = z.infer<typeof SyncVercelEnvResponse>;
