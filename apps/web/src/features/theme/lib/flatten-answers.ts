import type { ThemeOptionsQuestion } from "@repo/contracts";
import { SKIP_ANSWER, type PlanAnswers, type PlanQuestion } from "@/features/plan";

export function flattenThemeAnswers(
  answers: PlanAnswers,
): Record<string, string> | undefined {
  const next: Record<string, string> = {};
  for (const [need, value] of Object.entries(answers)) {
    if (value === SKIP_ANSWER) continue;
    next[need] = value;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

export function flattenThemeQuestions(
  questions: readonly PlanQuestion[],
): ThemeOptionsQuestion[] | undefined {
  if (questions.length === 0) return undefined;
  return questions.map((question) => ({
    need: question.need,
    text: question.text,
    label: question.label,
  }));
}
