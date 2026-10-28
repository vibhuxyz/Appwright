import type { DesignEvalCaseResult, DesignEvalResult } from "./run-design-eval";

const MAX_LISTED_FINDINGS = 5;

function baselineLine(entry: DesignEvalCaseResult): string {
  return entry.baselines
    .map((baseline) => {
      if (baseline.status === "same" || baseline.status === "changed") {
        return `${baseline.viewport} ${baseline.status} (${(baseline.changedShare * 100).toFixed(2)}%)`;
      }
      if (baseline.status === "size-changed") return `${baseline.viewport} size ${baseline.before} → ${baseline.after}`;
      return `${baseline.viewport} ${baseline.status}`;
    })
    .join(", ");
}

function reviewLine(entry: DesignEvalCaseResult): string[] {
  if (!entry.review) return [];
  if (!entry.review.ok) return [`  vision (AI judgement): not run — ${entry.review.reason}`];
  const scores = Object.entries(entry.review.review.scores).map(([name, score]) => `${name} ${score}`).join(", ");
  return [`  vision (AI judgement, not a pass/fail): ${scores}; ${entry.review.review.issues.length} issue(s)`];
}

function caseLines(entry: DesignEvalCaseResult): string[] {
  const { grade } = entry;
  const findings = [...grade.errors, ...grade.warnings]
    .slice(0, MAX_LISTED_FINDINGS)
    .map((finding) => `  ${finding.severity} ${finding.viewport} ${finding.kind}: ${finding.message.slice(0, 160)}`);
  return [
    `${grade.passed ? "PASS" : "FAIL"} ${grade.id}: ${grade.errors.length} error(s), ${grade.warnings.length} warning(s), ${grade.ignoredSampleLinks} sample link(s) ignored${grade.missingSections.length > 0 ? `, missing ${grade.missingSections.join(", ")}` : ""}`,
    `  baselines: ${baselineLine(entry) || "no screenshots"}`,
    ...grade.interactions.map((check) => `  ${check.passed ? "ok  " : "FAIL"} interaction ${check.id}: ${check.detail}`),
    ...findings,
    ...reviewLine(entry),
  ];
}

export function formatDesignReport(result: DesignEvalResult): string {
  return [`Design eval (workspace ${result.workspaceDir})`, ...result.cases.flatMap(caseLines)].join("\n");
}
