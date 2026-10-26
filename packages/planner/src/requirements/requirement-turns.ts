import {
  QUESTION_TRANSCRIPT_LIMITS,
  flattenTranscriptText,
  formatQuestionReplyContent,
  formatQuestionSetContent,
  type QuestionReplyData,
  type QuestionSetData,
} from "@repo/contracts";
import { defaultOptionText, SKIP_PROMPT_ANSWER, type PromptAnswer } from "./apply-prompt-answers";
import type { IntakeQuestion } from "./types";

const limits = QUESTION_TRANSCRIPT_LIMITS;
export const INTAKE_QUESTIONS_INTRO = "Before I start, please confirm these key details:";

export type RequirementTurn =
  | { readonly role: "assistant"; readonly content: string; readonly data: { questionSet: QuestionSetData } }
  | { readonly role: "user"; readonly content: string; readonly data: { questionReply: QuestionReplyData } };

function isSkipped(raw: PromptAnswer | undefined): boolean {
  return raw === undefined || raw === SKIP_PROMPT_ANSWER;
}

function answerText(question: IntakeQuestion, raw: PromptAnswer | undefined): string {
  const answer = isSkipped(raw) ? `${defaultOptionText(question) || "No answer"} (default)` : String(raw);
  return flattenTranscriptText(answer, limits.maxAnswerChars);
}

function questionSet(asked: readonly IntakeQuestion[], moreCount: number): QuestionSetData {
  return {
    kind: "intake",
    intro: INTAKE_QUESTIONS_INTRO,
    items: asked.map((question) => ({
      label: flattenTranscriptText(question.label, limits.maxLabelChars),
      text: flattenTranscriptText(question.text, limits.maxTextChars),
      options: question.options.slice(0, limits.maxOptions).map((option) => flattenTranscriptText(option, limits.maxOptionChars)),
    })),
    moreCount,
  };
}

export function requirementTurns(
  answers?: Readonly<Record<string, PromptAnswer>>,
  questions: readonly IntakeQuestion[] = [],
): readonly RequirementTurn[] {
  if (!answers || questions.length === 0) return [];
  const asked = questions.slice(0, limits.maxItems);
  const moreCount = Math.max(0, questions.length - limits.maxItems);
  const set = questionSet(asked, moreCount);
  const reply: QuestionReplyData = {
    kind: "intake",
    outcome: questions.every((question) => isSkipped(answers[question.need])) ? "skipped" : "answered",
    items: asked.map((question) => ({
      label: flattenTranscriptText(question.label, limits.maxLabelChars),
      text: flattenTranscriptText(question.text, limits.maxTextChars),
      answer: answerText(question, answers[question.need]),
    })),
    moreCount,
  };
  return [
    { role: "assistant", content: formatQuestionSetContent(set), data: { questionSet: set } },
    { role: "user", content: formatQuestionReplyContent(reply), data: { questionReply: reply } },
  ];
}
