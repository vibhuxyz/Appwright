import { QUESTION_TRANSCRIPT_LIMITS, flattenTranscriptText, type IntakeAnswer } from "@repo/contracts";
import { defaultOptionText, SKIP_PROMPT_ANSWER, type PromptAnswer } from "./apply-prompt-answers";
import type { IntakeQuestion } from "./types";

const limits = QUESTION_TRANSCRIPT_LIMITS;

function answerFor(question: IntakeQuestion, raw: PromptAnswer | undefined): IntakeAnswer {
  const need = question.need.slice(0, limits.maxKeyChars);
  if (raw !== undefined && raw !== SKIP_PROMPT_ANSWER) {
    return { need, answer: flattenTranscriptText(raw, limits.maxAnswerChars), source: "user" };
  }
  const fallback = defaultOptionText(question);
  if (!fallback) return { need, answer: "", source: "skip" };
  return { need, answer: flattenTranscriptText(fallback, limits.maxAnswerChars), source: "default" };
}

export function structuredAnswers(
  answers: Readonly<Record<string, PromptAnswer>> | undefined,
  questions: readonly IntakeQuestion[],
): IntakeAnswer[] {
  if (!answers) return [];
  return questions.slice(0, limits.maxItems).map((question) => answerFor(question, answers[question.need]));
}
