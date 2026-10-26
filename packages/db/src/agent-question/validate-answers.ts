import type { AgentQuestionAnswer, AgentQuestionItem } from "@repo/contracts";
import type { AnswerValidation } from "./types";

function validateOne(question: AgentQuestionItem, answer: AgentQuestionAnswer, position: number): string | null {
  const hasOtherText = Boolean(answer.otherText?.trim());
  if (answer.selectedOptionIndexes.length === 0 && !hasOtherText) {
    return `Question ${position} needs a choice or your own answer`;
  }
  if (answer.selectedOptionIndexes.some((index) => index >= question.options.length)) {
    return `Question ${position} has a choice that does not exist`;
  }
  if (new Set(answer.selectedOptionIndexes).size !== answer.selectedOptionIndexes.length) {
    return `Question ${position} repeats a choice`;
  }
  if (question.inputType === "single" && answer.selectedOptionIndexes.length + (hasOtherText ? 1 : 0) > 1) {
    return `Question ${position} takes one answer`;
  }
  return null;
}

export function validateAgentQuestionAnswers(
  questions: readonly AgentQuestionItem[],
  answers: readonly AgentQuestionAnswer[],
): AnswerValidation {
  if (answers.length !== questions.length) {
    return { ok: false, message: `Expected ${questions.length} answers, received ${answers.length}` };
  }
  for (const [index, question] of questions.entries()) {
    const answer = answers[index];
    if (!answer) return { ok: false, message: `Question ${index + 1} has no answer` };
    const problem = validateOne(question, answer, index + 1);
    if (problem) return { ok: false, message: problem };
  }
  return { ok: true };
}
