import { overallPassRate, type CaseSummary } from "./summarize";

export function formatReport(summaries: readonly CaseSummary[]): string {
  const lines = summaries.flatMap((summary) => [
    `${summary.passes === summary.trials ? "✓" : "✗"} ${summary.caseId} — ${summary.passes}/${summary.trials} · ${summary.meanToolCalls.toFixed(1)} tool calls · $${summary.meanCostUsd.toFixed(4)}`,
    ...summary.failedGrades.map((failure) => `    ${failure}`),
  ]);
  const overall = (overallPassRate(summaries) * 100).toFixed(1);
  return [...lines, "", `overall pass rate: ${overall}%`].join("\n");
}
