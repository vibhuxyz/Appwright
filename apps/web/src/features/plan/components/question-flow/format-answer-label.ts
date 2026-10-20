import { SKIP_ANSWER, type AnswerValue } from "../../schemas/plan-schemas";

export function formatAnswerLabel(value: AnswerValue, defaultOption: string): string {
  if (value === SKIP_ANSWER) {
    return `Skipped — defaults to ${defaultOption}`;
  }
  return value;
}
