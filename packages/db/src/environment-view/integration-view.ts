import {
  IntegrationProviderSchema,
  IntegrationStatusSchema,
  isConfigurableIntegrationProvider,
  type CredentialSource,
  type DatabaseSource,
  type EnvironmentIntegrationView,
  type IntegrationProvider,
  type IntegrationStatus,
} from "@repo/contracts";
import type { IntegrationEnvironmentRecord, IntegrationRecord, SkippedIntegration } from "./types";

const MANAGED_CREDENTIAL_MODE = "APPWRITE_MANAGED";
const UNSET_ENVIRONMENT_STATUS = "configuration_required";

export function normalizeEnvironmentStatus(rawStatus: string): IntegrationStatus {
  if (rawStatus === UNSET_ENVIRONMENT_STATUS) return "missing";
  const parsed = IntegrationStatusSchema.safeParse(rawStatus);
  return parsed.success ? parsed.data : "missing";
}

function credentialSourceFor(
  provider: IntegrationProvider,
  row: IntegrationEnvironmentRecord | undefined,
): CredentialSource {
  if (!isConfigurableIntegrationProvider(provider)) return "NOT_APPLICABLE";
  if (!row || row.status === UNSET_ENVIRONMENT_STATUS) return "NOT_SET";
  return row.credentialMode === MANAGED_CREDENTIAL_MODE ? "APPWRIGHT_TEST_KEY" : "YOUR_KEY";
}

function databaseView(required: boolean, database: DatabaseSource): EnvironmentIntegrationView {
  const isReady = database.source === "APPWRIGHT" || database.source === "BYOK";
  return {
    provider: "mongodb",
    required,
    status: isReady ? "connected" : required ? "missing" : "not_required",
    credentialSource: database.source === "BYOK" ? "YOUR_KEY" : isReady ? "APPWRIGHT_TEST_KEY" : "NOT_SET",
    lastTestedAt: null,
    lastError: null,
  };
}

function toView(
  provider: IntegrationProvider,
  integration: IntegrationRecord,
  row: IntegrationEnvironmentRecord | undefined,
): EnvironmentIntegrationView {
  const fallbackStatus: IntegrationStatus = integration.required ? "missing" : "not_required";
  return {
    provider,
    required: integration.required,
    status: row ? normalizeEnvironmentStatus(row.status) : fallbackStatus,
    credentialSource: credentialSourceFor(provider, row),
    lastTestedAt: row?.lastTestedAt?.toISOString() ?? null,
    lastError: row?.lastError ?? null,
  };
}

export function toIntegrationViews(input: {
  integrations: readonly IntegrationRecord[];
  environment: string;
  database: DatabaseSource;
}): { items: EnvironmentIntegrationView[]; skipped: SkippedIntegration[] } {
  const items: EnvironmentIntegrationView[] = [];
  const skipped: SkippedIntegration[] = [];
  for (const integration of input.integrations) {
    const provider = IntegrationProviderSchema.safeParse(integration.provider);
    if (!provider.success) {
      skipped.push({ provider: integration.provider, reason: "Unknown integration provider" });
      continue;
    }
    const row = integration.environments.find((entry) => entry.environment === input.environment);
    const useDatabaseSource = provider.data === "mongodb" && !row;
    items.push(useDatabaseSource
      ? databaseView(integration.required, input.database)
      : toView(provider.data, integration, row));
  }
  items.sort((left, right) => left.provider.localeCompare(right.provider));
  return { items, skipped };
}
