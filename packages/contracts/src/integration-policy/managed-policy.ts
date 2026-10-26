import type { IntegrationEnvironment, IntegrationProvider } from "../environment";

export const REQUESTABLE_INTEGRATION_PROVIDERS = [
  "razorpay",
  "cloudinary",
  "email",
  "google-oauth",
  "mongodb",
] as const satisfies readonly IntegrationProvider[];

export type RequestableIntegrationProvider = (typeof REQUESTABLE_INTEGRATION_PROVIDERS)[number];

const MANAGED_IN_EVERY_ENVIRONMENT: ReadonlySet<IntegrationProvider> = new Set(["mongodb"]);
const NEVER_MANAGED: ReadonlySet<IntegrationProvider> = new Set(["google-oauth"]);

export function isManagedCredentialAllowed(
  provider: IntegrationProvider,
  environment: IntegrationEnvironment,
): boolean {
  if (NEVER_MANAGED.has(provider)) return false;
  if (MANAGED_IN_EVERY_ENVIRONMENT.has(provider)) return true;
  return environment !== "production";
}
