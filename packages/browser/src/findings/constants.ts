import type { FindingKind, FindingSeverity, Viewport } from "./types";

export const VIEWPORTS: readonly Viewport[] = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

export const SEVERITY_BY_KIND = {
  "navigation-failed": "error",
  "http-error": "error",
  "console-error": "error",
  "page-error": "error",
  "request-failed": "warning",
  "horizontal-overflow": "error",
  "broken-image": "error",
  "unlabelled-control": "warning",
  "empty-page": "error",
  "broken-link": "error",
  "form-server-error": "error",
  "form-accepts-empty": "error",
  "form-accepts-invalid": "error",
  "form-no-response": "error",
  "form-no-submit": "warning",
  "interaction-error": "error",
} as const satisfies Record<FindingKind, FindingSeverity>;
