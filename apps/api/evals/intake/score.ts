import type { IntakeQuestion } from "@repo/planner";
import type { IntakeEvalCase } from "./cases";

export interface CaseResult {
  readonly name: string;
  readonly latencyMs: number;
  readonly needs: readonly string[];
  readonly isCatalogFallback: boolean;
  readonly failures: readonly string[];
}

export function isSameAsCatalog(
  questions: readonly Pick<IntakeQuestion, "text">[],
  catalog: readonly Pick<IntakeQuestion, "text">[],
): boolean {
  if (questions.length !== catalog.length) return false;
  return questions.every((question, index) => question.text === catalog[index]?.text);
}

export function caseFailures(evalCase: IntakeEvalCase, questions: readonly IntakeQuestion[]): string[] {
  const needs = new Set(questions.map((question) => question.need));
  const allText = questions.map((question) => `${question.text} ${question.options.join(" ")}`).join(" ");
  const repeated = evalCase.mustNotAsk.filter((need) => needs.has(need)).map((need) => `asked ${need}`);
  const missing = evalCase.mustMention
    .filter((pattern) => !pattern.test(allText))
    .map((pattern) => `no question matches ${pattern.source}`);
  const tooMany =
    questions.length > evalCase.maxQuestions ? [`${questions.length} questions > ${evalCase.maxQuestions}`] : [];
  const contacts = questions.find((question) => question.inputType === "contacts");
  const tooManyFields =
    contacts && contacts.options.length > evalCase.maxContactFields
      ? [`${contacts.options.length} contact fields > ${evalCase.maxContactFields}`]
      : [];
  return [...repeated, ...missing, ...tooMany, ...tooManyFields];
}

export function sharedNeedRate(results: readonly CaseResult[]): number {
  const counts = new Map<string, number>();
  for (const result of results) {
    for (const need of new Set(result.needs)) counts.set(need, (counts.get(need) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;
  const shared = [...counts.values()].filter((count) => count > 1).reduce((sum, count) => sum + count, 0);
  return shared / total;
}

export function percentile(values: readonly number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0;
}
