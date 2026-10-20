import type { IntakeQuestion } from "./types";

export const SKIP_PROMPT_ANSWER = "skip" as const;
export type PromptAnswer = string | typeof SKIP_PROMPT_ANSWER;

function defaultOptionText(question: IntakeQuestion): string {
  return question.options[question.defaultOptionIndex] ?? question.options[0] ?? "";
}

function chosenAnswerText(question: IntakeQuestion, raw: PromptAnswer | undefined): string {
  if (typeof raw === "string" && raw !== SKIP_PROMPT_ANSWER) return raw;
  return defaultOptionText(question);
}

export function applyPromptAnswers(
  prompt: string,
  answers?: Readonly<Record<string, PromptAnswer>>,
  questions: readonly IntakeQuestion[] = [],
): string {
  if (!answers || questions.length === 0) return prompt;
  const lines = questions.map(
    (question) => `- ${question.label}: ${chosenAnswerText(question, answers[question.need])}`,
  );
  return `${prompt.trim()}\n\nRequirements for this plan:\n${lines.join("\n")}`;
}

export interface RequirementTurn {
  readonly role: "assistant" | "user";
  readonly content: string;
}

function spokenAnswer(raw: PromptAnswer | undefined, question: IntakeQuestion): string {
  if (typeof raw === "string" && raw !== SKIP_PROMPT_ANSWER) return raw;
  return `Skipped — defaults to ${defaultOptionText(question)}`;
}

export function requirementTurns(
  answers?: Readonly<Record<string, PromptAnswer>>,
  questions: readonly IntakeQuestion[] = [],
): readonly RequirementTurn[] {
  if (!answers || questions.length === 0) return [];
  return questions.flatMap((question) => [
    { role: "assistant", content: question.text },
    { role: "user", content: spokenAnswer(answers[question.need], question) },
  ]);
}
