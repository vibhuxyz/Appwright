import type { Finding } from "@repo/browser";
import { findRenderedSections } from "@repo/ui-system";
import type { DesignCase } from "./cases";
import type { InteractionResult } from "./interaction-types";

const SAMPLE_CONTENT_KINDS: ReadonlySet<string> = new Set(["broken-link"]);

export interface CaseGrade {
  readonly id: string;
  readonly ignoredSampleLinks: number;
  readonly passed: boolean;
  readonly missingSections: readonly string[];
  readonly errors: readonly Finding[];
  readonly warnings: readonly Finding[];
  readonly interactions: readonly InteractionResult[];
}

export function gradeCase(
  designCase: DesignCase,
  html: string,
  findings: readonly Finding[],
  interactions: readonly InteractionResult[] = [],
): CaseGrade {
  const rendered = findRenderedSections(html, designCase.expectedSections);
  const routeFindings = findings.filter((finding) => finding.route === designCase.route);
  const own = routeFindings.filter((finding) => !SAMPLE_CONTENT_KINDS.has(finding.kind));
  const errors = own.filter((finding) => finding.severity === "error");
  const warnings = own.filter((finding) => finding.severity === "warning");
  return {
    id: designCase.id,
    ignoredSampleLinks: routeFindings.length - own.length,
    passed: rendered.missing.length === 0 && errors.length === 0 && interactions.every((entry) => entry.passed),
    missingSections: rendered.missing,
    errors,
    warnings,
    interactions,
  };
}
