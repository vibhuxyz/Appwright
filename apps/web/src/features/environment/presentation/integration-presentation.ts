import type {
  CredentialSource,
  DatabaseSource,
  IntegrationEnvironment,
  IntegrationProvider,
  IntegrationStatus,
} from "@repo/contracts";

export type PresentationTone = "success" | "info" | "warning" | "danger" | "muted";

export interface StatusPresentation {
  label: string;
  tone: PresentationTone;
}

export const TONE_BADGE_CLASS: Record<PresentationTone, string> = {
  success: "border-success/30 bg-success/15 text-success",
  info: "border-info/30 bg-info/15 text-info",
  warning: "border-warning/30 bg-warning/15 text-warning",
  danger: "border-danger/30 bg-danger/15 text-danger",
  muted: "border-border bg-surface-2 text-muted",
};

export const TONE_TEXT_CLASS: Record<PresentationTone, string> = {
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
  danger: "text-danger",
  muted: "text-muted",
};

const STATUS_PRESENTATION: Record<IntegrationStatus, StatusPresentation> = {
  connected: { label: "Connected", tone: "success" },
  verified: { label: "Verified", tone: "success" },
  configured: { label: "Configured", tone: "info" },
  testing: { label: "Testing", tone: "info" },
  invalid: { label: "Invalid config", tone: "danger" },
  test_failed: { label: "Test failed", tone: "danger" },
  quota_exhausted: { label: "Quota exhausted", tone: "danger" },
  production_configuration_required: { label: "Needs your key", tone: "warning" },
  missing: { label: "Not set up", tone: "warning" },
  not_required: { label: "Not required", tone: "muted" },
};

export function integrationStatusPresentation(status: IntegrationStatus): StatusPresentation {
  return STATUS_PRESENTATION[status];
}

export function credentialSourceLabel(provider: IntegrationProvider, source: CredentialSource): string | null {
  const isDatabase = provider === "mongodb";
  switch (source) {
    case "APPWRIGHT_TEST_KEY":
      return isDatabase ? "Appwright database" : "Appwright test key";
    case "YOUR_KEY":
      return isDatabase ? "Your MongoDB URI" : "Your key";
    case "NOT_SET":
      return "Not set";
    case "NOT_APPLICABLE":
      return null;
    default: {
      const unhandled: never = source;
      return unhandled;
    }
  }
}

export function databaseSourcePresentation(
  database: DatabaseSource,
  environment: IntegrationEnvironment,
): StatusPresentation & { detail: string | null } {
  switch (database.source) {
    case "APPWRIGHT":
      return { label: "Appwright database", tone: "success", detail: database.databaseName };
    case "BYOK":
      return { label: "Your MongoDB URI", tone: "success", detail: null };
    case "NOT_PROVISIONED":
      return environment === "development"
        ? { label: "Not provisioned yet", tone: "warning", detail: null }
        : { label: "Not provisioned — created on first deploy", tone: "muted", detail: null };
    case "NOT_REQUIRED":
      return { label: "Not required", tone: "muted", detail: null };
    default: {
      const unhandled: never = database.source;
      return unhandled;
    }
  }
}
