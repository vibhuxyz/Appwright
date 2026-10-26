import { z } from "zod";
import {
  AUTH_PROVIDERS,
  DATABASE_PROVIDERS,
  EMAIL_PROVIDERS,
  ENVIRONMENT_NAMES,
  FRAMEWORK_TYPES,
  ORM_TYPES,
  REALTIME_PROVIDERS,
  RUNTIME_TYPES,
  STORAGE_PROVIDERS,
} from "./constants";

export const FrameworkTypeSchema = z.enum(FRAMEWORK_TYPES);
export type FrameworkType = z.infer<typeof FrameworkTypeSchema>;

export const RuntimeTypeSchema = z.enum(RUNTIME_TYPES);
export type RuntimeType = z.infer<typeof RuntimeTypeSchema>;

export const DatabaseProviderSchema = z.enum(DATABASE_PROVIDERS);
export type DatabaseProvider = z.infer<typeof DatabaseProviderSchema>;

export const OrmTypeSchema = z.enum(ORM_TYPES);
export type OrmType = z.infer<typeof OrmTypeSchema>;

export const AuthProviderSchema = z.enum(AUTH_PROVIDERS);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

export const StorageProviderSchema = z.enum(STORAGE_PROVIDERS);
export type StorageProvider = z.infer<typeof StorageProviderSchema>;

export const EmailProviderSchema = z.enum(EMAIL_PROVIDERS);
export type EmailProvider = z.infer<typeof EmailProviderSchema>;

export const RealtimeProviderSchema = z.enum(REALTIME_PROVIDERS);
export type RealtimeProvider = z.infer<typeof RealtimeProviderSchema>;

export const EnvironmentNameSchema = z.enum(ENVIRONMENT_NAMES);
export type EnvironmentName = z.infer<typeof EnvironmentNameSchema>;

export const EnvVarDefinitionSchema = z.object({
  key: z.string().min(1),
  description: z.string(),
  required: z.boolean(),
  isSecret: z.boolean(),
  scopes: z.array(EnvironmentNameSchema).min(1),
  exampleValue: z.string().optional(),
});
export type EnvVarDefinition = z.infer<typeof EnvVarDefinitionSchema>;

export const DatabaseRequirementSchema = z.object({
  provider: DatabaseProviderSchema,
  required: z.boolean(),
  orm: OrmTypeSchema,
});
export type DatabaseRequirement = z.infer<typeof DatabaseRequirementSchema>;

export const AuthRequirementSchema = z.object({
  provider: AuthProviderSchema,
  required: z.boolean(),
  features: z.array(z.string()).default([]),
});
export type AuthRequirement = z.infer<typeof AuthRequirementSchema>;

export const StorageRequirementSchema = z.object({
  provider: StorageProviderSchema,
  required: z.boolean(),
  capabilities: z.array(z.string()).default([]),
});
export type StorageRequirement = z.infer<typeof StorageRequirementSchema>;

export const EmailRequirementSchema = z.object({
  provider: EmailProviderSchema,
  required: z.boolean(),
});
export type EmailRequirement = z.infer<typeof EmailRequirementSchema>;

export const RealtimeRequirementSchema = z.object({
  provider: RealtimeProviderSchema,
  required: z.boolean(),
});
export type RealtimeRequirement = z.infer<typeof RealtimeRequirementSchema>;

export const ExternalApiRequirementSchema = z.object({
  name: z.string().min(1),
  required: z.boolean(),
  description: z.string().optional(),
});
export type ExternalApiRequirement = z.infer<
  typeof ExternalApiRequirementSchema
>;

export const BuildRequirementSchema = z.object({
  command: z.string(),
  outputDir: z.string(),
  nodeVersion: z.string().default("20.x"),
});
export type BuildRequirement = z.infer<typeof BuildRequirementSchema>;

export const EnvironmentScopeRequirementSchema = z.object({
  requiredVars: z.array(z.string()),
});
export type EnvironmentScopeRequirement = z.infer<
  typeof EnvironmentScopeRequirementSchema
>;

export const DependencyManifestSchema = z.object({
  manifestVersion: z.literal(1),
  projectId: z.string().min(1),
  framework: FrameworkTypeSchema,
  runtime: RuntimeTypeSchema,
  database: DatabaseRequirementSchema,
  auth: AuthRequirementSchema,
  storage: StorageRequirementSchema,
  email: EmailRequirementSchema,
  realtime: RealtimeRequirementSchema,
  externalApis: z.array(ExternalApiRequirementSchema).default([]),
  envVars: z.array(EnvVarDefinitionSchema).default([]),
  environments: z.object({
    development: EnvironmentScopeRequirementSchema,
    preview: EnvironmentScopeRequirementSchema,
    production: EnvironmentScopeRequirementSchema,
  }),
  build: BuildRequirementSchema,
});
export type DependencyManifest = z.infer<typeof DependencyManifestSchema>;
