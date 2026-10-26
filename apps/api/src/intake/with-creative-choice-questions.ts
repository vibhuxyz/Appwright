import { CREATIVE_CHOICE_NEEDS, CREATIVE_CHOICE_QUESTIONS, hasCreativeChoice } from "@repo/contracts";
import type { IntakeQuestion } from "@repo/planner";

export function withCreativeChoiceQuestions(
  generated: readonly IntakeQuestion[],
  answers: Readonly<Record<string, string>> | undefined,
): IntakeQuestion[] {
  if (hasCreativeChoice(answers, CREATIVE_CHOICE_NEEDS.design)) return [...generated];
  return [...generated, ...CREATIVE_CHOICE_QUESTIONS];
}
