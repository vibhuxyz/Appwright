import {
  parseIntegrationCredentialValues,
  type ConfigurableIntegrationProvider,
  type IntegrationConfigurationRequest,
  type IntegrationEnvironment,
  type IntegrationField,
} from "@repo/contracts";
import { credentialFieldErrorKey, type CredentialDraft, type CredentialScope } from "./types";

export type ConfigureRequestsResult =
  | { ok: true; requests: IntegrationConfigurationRequest[]; notice: string | null }
  | { ok: false; message: string; fieldErrors: Record<string, string> };

const PREVIEW_AND_DEVELOPMENT: readonly IntegrationEnvironment[] = ["development", "preview"];
const RAZORPAY_LIVE_KEY_NOTICE = "Add your live Razorpay key before deploying to production.";

function trimmedValues(fields: readonly IntegrationField[], values: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field.key, values[field.key]?.trim() ?? ""]));
}

export function missingFieldErrors(
  fields: readonly IntegrationField[],
  values: Readonly<Record<string, string>>,
  scope: CredentialScope,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (field.isRequired && !values[field.key]?.trim()) {
      errors[credentialFieldErrorKey(scope, field.key)] = `${field.label} is required`;
    }
  }
  return errors;
}

function invalid(scope: CredentialScope, fields: readonly IntegrationField[], message: string): ConfigureRequestsResult {
  const firstField = fields[0];
  const fieldErrors = firstField ? { [credentialFieldErrorKey(scope, firstField.key)]: message } : {};
  return { ok: false, message, fieldErrors };
}

function request(
  provider: ConfigurableIntegrationProvider,
  environment: IntegrationEnvironment,
  values: Record<string, string>,
): IntegrationConfigurationRequest {
  return { provider, credentialMode: "BYOK", environment, values };
}

function buildOwnKeyRequests(input: {
  provider: ConfigurableIntegrationProvider;
  fields: readonly IntegrationField[];
  draft: CredentialDraft;
}): ConfigureRequestsResult {
  const { provider, fields, draft } = input;
  const missing = {
    ...missingFieldErrors(fields, draft.primaryValues, "primary"),
    ...(draft.hasSeparateProductionKey ? missingFieldErrors(fields, draft.productionValues, "production") : {}),
  };
  if (Object.keys(missing).length > 0) return { ok: false, message: "Fill in the required fields", fieldErrors: missing };

  const primary = parseIntegrationCredentialValues(provider, "development", trimmedValues(fields, draft.primaryValues));
  if (!primary) return invalid("primary", fields, provider === "razorpay" ? "Use Razorpay test keys (rzp_test_…) for development" : "These credentials are not valid");
  const requests = PREVIEW_AND_DEVELOPMENT.map((environment) => request(provider, environment, primary));

  const productionSource = draft.hasSeparateProductionKey ? draft.productionValues : draft.primaryValues;
  if (provider === "razorpay" && !draft.hasSeparateProductionKey) {
    return { ok: true, requests, notice: RAZORPAY_LIVE_KEY_NOTICE };
  }
  const production = parseIntegrationCredentialValues(provider, "production", trimmedValues(fields, productionSource));
  if (!production) return invalid("production", fields, provider === "razorpay" ? "Use Razorpay live keys (rzp_live_…) for production" : "These production credentials are not valid");
  return { ok: true, requests: [...requests, request(provider, "production", production)], notice: null };
}

export function buildConfigureRequests(input: {
  provider: ConfigurableIntegrationProvider;
  fields: readonly IntegrationField[];
  draft: CredentialDraft;
}): ConfigureRequestsResult {
  if (input.draft.choice === null) {
    return { ok: false, message: "Choose the Appwright test key or your own key", fieldErrors: {} };
  }
  if (input.draft.choice === "YOUR_KEY") return buildOwnKeyRequests(input);
  return {
    ok: true,
    requests: PREVIEW_AND_DEVELOPMENT.map((environment) => ({
      provider: input.provider,
      credentialMode: "APPWRITE_MANAGED" as const,
      environment,
      values: {},
    })),
    notice: null,
  };
}
