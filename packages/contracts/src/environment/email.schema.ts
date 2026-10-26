import { z } from "zod";
import { EMAIL_PROVIDER_TYPES, INTEGRATION_ENVIRONMENTS, VARIABLE_SCOPES } from "./constants";

export const EmailProviderTypeSchema = z.enum(EMAIL_PROVIDER_TYPES);
export type EmailProviderType = z.infer<typeof EmailProviderTypeSchema>;

export const SelectableEmailProviderSchema = z.enum(["brevo", "nodemailer"]);
export type SelectableEmailProvider = z.infer<typeof SelectableEmailProviderSchema>;

export const ResendConfigSchema = z.object({
  apiKey: z.string().min(1),
  emailFrom: z.string().email().optional(),
});
export type ResendConfig = z.infer<typeof ResendConfigSchema>;

export const BrevoConfigSchema = z.object({
  apiKey: z.string().min(1),
  emailFrom: z.string().email().optional(),
});
export type BrevoConfig = z.infer<typeof BrevoConfigSchema>;

export const NodemailerConfigSchema = z.object({
  host: z.string().min(1),
  port: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  user: z.string().optional(),
  password: z.string().optional(),
  secure: z.union([z.boolean(), z.string()]).default(false),
  emailFrom: z.string().email().optional(),
});
export type NodemailerConfig = z.infer<typeof NodemailerConfigSchema>;

export const SetEmailProviderRequest = z.object({
  environment: z.enum(INTEGRATION_ENVIRONMENTS),
  provider: SelectableEmailProviderSchema,
  config: z.record(z.string(), z.string()).optional(),
});
export type SetEmailProviderRequest = z.infer<typeof SetEmailProviderRequest>;

export const SendTestEmailRequest = z.object({
  environment: z.enum(["development", "preview", "production"]).default("development"),
  to: z.string().email(),
  subject: z.string().default("Appwright Test Email"),
  text: z.string().optional(),
  html: z.string().optional(),
});
export type SendTestEmailRequest = z.infer<typeof SendTestEmailRequest>;

export const SendTestEmailResponse = z.object({
  ok: z.boolean(),
  provider: z.string(),
  messageId: z.string().optional(),
  message: z.string(),
  error: z.string().optional(),
});
export type SendTestEmailResponse = z.infer<typeof SendTestEmailResponse>;

export const IntegrationConfigRequiredRequest = z.object({
  id: z.string(),
  sessionId: z.string().optional(),
  projectId: z.string(),
  provider: z.string(),
  required: z.boolean(),
  reason: z.string(),
  environment: z.enum(VARIABLE_SCOPES).default("development"),
  createdAt: z.string(),
});
export type IntegrationConfigRequiredRequest = z.infer<
  typeof IntegrationConfigRequiredRequest
>;
