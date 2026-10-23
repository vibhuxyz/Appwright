export const FINDING_KINDS = [
  "navigation-failed",
  "http-error",
  "console-error",
  "page-error",
  "request-failed",
  "horizontal-overflow",
  "broken-image",
  "unlabelled-control",
  "empty-page",
  "broken-link",
  "form-server-error",
  "form-accepts-empty",
  "form-accepts-invalid",
  "form-no-response",
  "form-no-submit",
  "interaction-error",
] as const;
export type FindingKind = (typeof FINDING_KINDS)[number];

export const FINDING_SEVERITIES = ["error", "warning"] as const;
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export interface Viewport {
  readonly name: string;
  readonly width: number;
  readonly height: number;
}

export interface Finding {
  readonly kind: FindingKind;
  readonly severity: FindingSeverity;
  readonly route: string;
  readonly viewport: string;
  readonly message: string;
  readonly screenshot?: string;
}
