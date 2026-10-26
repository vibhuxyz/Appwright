import { z } from "zod";
import {
  CREDENTIAL_MODES,
  INTEGRATION_CATEGORIES,
  INTEGRATION_ENVIRONMENTS,
  INTEGRATION_PROVIDERS,
} from "./constants";

export const CredentialModeSchema = z.enum(CREDENTIAL_MODES);
export type CredentialMode = z.infer<typeof CredentialModeSchema>;

export const IntegrationEnvironmentSchema = z.enum(INTEGRATION_ENVIRONMENTS);
export type IntegrationEnvironment = z.infer<typeof IntegrationEnvironmentSchema>;

export const IntegrationCategorySchema = z.enum(INTEGRATION_CATEGORIES);
export type IntegrationCategory = z.infer<typeof IntegrationCategorySchema>;

export const IntegrationFieldSchema = z.object({
  key: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  label: z.string().min(1).max(80),
  inputType: z.enum(["text", "email", "password"]),
  isRequired: z.boolean(),
  isSecret: z.boolean(),
  placeholder: z.string().max(120),
  helpText: z.string().max(240),
});
export type IntegrationField = z.infer<typeof IntegrationFieldSchema>;

export const IntegrationCatalogEntrySchema = z.object({
  provider: z.enum(INTEGRATION_PROVIDERS),
  name: z.string().min(1).max(60),
  description: z.string().min(1).max(180),
  category: IntegrationCategorySchema,
  capabilities: z.array(z.string().max(60)).max(8),
  managedCapabilities: z.array(z.string().max(60)).max(8),
  setupInstructions: z.array(z.string().max(500)).max(8),
  fields: z.array(IntegrationFieldSchema).max(12),
  canUseManagedCredentials: z.boolean(),
});
export type IntegrationCatalogEntry = z.infer<typeof IntegrationCatalogEntrySchema>;

export const IntegrationConfigurationRequestSchema = z.object({
  provider: z.enum(INTEGRATION_PROVIDERS),
  credentialMode: CredentialModeSchema,
  environment: IntegrationEnvironmentSchema,
  values: z.record(z.string().regex(/^[A-Z][A-Z0-9_]*$/), z.string().max(4096)).default({}),
}).strict();
export type IntegrationConfigurationRequest = z.infer<typeof IntegrationConfigurationRequestSchema>;

export const IntegrationConfigurationResponseSchema = z.object({
  provider: z.enum(INTEGRATION_PROVIDERS),
  credentialMode: CredentialModeSchema.nullable(),
  environment: IntegrationEnvironmentSchema,
  status: z.string(),
  configuredFields: z.array(z.string()),
  lastTestedAt: z.string().nullable(),
  lastError: z.string().nullable(),
  message: z.string().optional(),
}).strict();
export type IntegrationConfigurationResponse = z.infer<typeof IntegrationConfigurationResponseSchema>;

export const IntegrationQuotaSchema = z.object({
  provider: z.enum(INTEGRATION_PROVIDERS),
  operation: z.string(),
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  remaining: z.number().int().nonnegative(),
});
export type IntegrationQuota = z.infer<typeof IntegrationQuotaSchema>;

export const IntegrationCatalogResponseSchema = z.object({
  catalog: z.array(IntegrationCatalogEntrySchema),
  configurations: z.array(IntegrationConfigurationResponseSchema),
  quotas: z.array(IntegrationQuotaSchema),
});
export type IntegrationCatalogResponse = z.infer<typeof IntegrationCatalogResponseSchema>;
