import { z } from "zod";
import type { IntegrationEnvironment } from "./catalog";
import type { IntegrationProvider } from "./environment.schema";

const MAX_MONGODB_URI_CHARS = 2048;

const credentialValueSchemas = {
  email: z.object({
    BREVO_API_KEY: z.string().min(10).max(300),
    EMAIL_FROM: z.string().email().max(254),
  }).strict(),
  razorpay: z.object({
    RAZORPAY_KEY_ID: z.string().regex(/^rzp_(test|live)_[A-Za-z0-9]+$/),
    RAZORPAY_KEY_SECRET: z.string().min(8).max(300),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(8).max(300),
  }).strict(),
  "google-oauth": z.object({
    GOOGLE_CLIENT_ID: z.string().regex(/^[^\s]+\.apps\.googleusercontent\.com$/),
    GOOGLE_CLIENT_SECRET: z.string().min(8).max(300),
  }).strict(),
  cloudinary: z.object({
    CLOUDINARY_CLOUD_NAME: z.string().regex(/^[a-z0-9-]{2,60}$/),
    CLOUDINARY_API_KEY: z.string().min(4).max(100),
    CLOUDINARY_API_SECRET: z.string().min(8).max(300),
  }).strict(),
  mongodb: z.object({
    MONGODB_URI: z.string().max(MAX_MONGODB_URI_CHARS).regex(/^mongodb(\+srv)?:\/\/\S+$/),
  }).strict(),
} as const;

export type ConfigurableIntegrationProvider = keyof typeof credentialValueSchemas;

export function isConfigurableIntegrationProvider(
  provider: IntegrationProvider,
): provider is ConfigurableIntegrationProvider {
  return Object.hasOwn(credentialValueSchemas, provider);
}

export function parseIntegrationCredentialValues(
  provider: ConfigurableIntegrationProvider,
  environment: IntegrationEnvironment,
  values: unknown,
): Record<string, string> | null {
  const parsed = credentialValueSchemas[provider].safeParse(values);
  if (!parsed.success) return null;
  const credentialValues = parsed.data as Record<string, string>;

  if (provider === "razorpay") {
    const expectedPrefix = environment === "production" ? "rzp_live_" : "rzp_test_";
    if (!credentialValues.RAZORPAY_KEY_ID?.startsWith(expectedPrefix)) return null;
  }

  return credentialValues;
}
