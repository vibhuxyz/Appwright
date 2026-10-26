import type { TrialResult } from "../core/types";

export interface CaseSummary {
  readonly caseId: string;
  readonly trials: number;
  readonly passes: number;
  readonly passRate: number;
  readonly failedGrades: readonly string[];
  readonly meanCostUsd: number;
  readonly meanToolCalls: number;
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function failureLabels(trial: TrialResult): string[] {
  const failedGrades = trial.grades
    .filter((grade) => !grade.passed)
    .map((grade) => `${grade.name}${grade.detail ? ` (${grade.detail})` : ""}`);
  return trial.crash ? [`crash (${trial.crash})`, ...failedGrades] : failedGrades;
}

export function summarize(results: readonly TrialResult[]): CaseSummary[] {
  const byCase = Map.groupBy(results, (result) => result.caseId);
  return [...byCase.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([caseId, trials]) => {
      const passes = trials.filter((trial) => trial.passed).length;
      return {
        caseId,
        trials: trials.length,
        passes,
        passRate: passes / trials.length,
        failedGrades: [...new Set(trials.flatMap(failureLabels))],
        meanCostUsd: mean(trials.map((trial) => trial.costUsd)),
        meanToolCalls: mean(trials.map((trial) => trial.toolCallCount)),
      };
    });
}

export function overallPassRate(summaries: readonly CaseSummary[]): number {
  return mean(summaries.map((summary) => summary.passRate));
}
