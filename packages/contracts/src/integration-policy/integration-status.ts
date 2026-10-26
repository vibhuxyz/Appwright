import type { IntegrationStatus } from "../environment";

export type RecordedIntegrationStatus =
  | "connected"
  | "configured"
  | "test_failed"
  | "missing"
  | "production_configuration_required";

const FAILURE_STATUSES: ReadonlySet<string> = new Set([
  "test_failed",
  "missing",
  "production_configuration_required",
]);

export function toRecordedStatus(testStatus: IntegrationStatus): RecordedIntegrationStatus {
  switch (testStatus) {
    case "verified":
    case "connected":
      return "connected";
    case "configured":
      return "configured";
    case "production_configuration_required":
      return "production_configuration_required";
    case "missing":
      return "missing";
    default:
      return "test_failed";
  }
}

export function isFailureStatus(status: string): boolean {
  return FAILURE_STATUSES.has(status);
}

export function summarizeIntegrationStatus(input: {
  environmentStatuses: readonly string[];
  required: boolean;
}): IntegrationStatus {
  if (input.environmentStatuses.includes("connected")) return "connected";
  if (input.environmentStatuses.includes("configured")) return "configured";
  return input.required ? "missing" : "not_required";
}
