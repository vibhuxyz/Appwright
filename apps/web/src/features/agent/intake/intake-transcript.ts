import {
  QUESTION_TRANSCRIPT_LIMITS,
  flattenTranscriptText,
  type QuestionReplyData,
} from "@repo/contracts";
import { SKIP_ANSWER, type PlanAnswers, type PlanQuestion } from "@/features/plan";
import type { QuestionCardModel } from "../transcript";

const limits = QUESTION_TRANSCRIPT_LIMITS;
const INTAKE_INTRO = "Before I start, please confirm these key details:";

export function intakeQuestionCard(questions: readonly PlanQuestion[], status: QuestionCardModel["status"]): QuestionCardModel {
  return {
    intro: INTAKE_INTRO,
    items: questions.slice(0, limits.maxItems).map((question) => ({
      label: question.label,
      text: question.text,
      options: question.options.slice(0, limits.maxOptions),
    })),
    moreCount: Math.max(0, questions.length - limits.maxItems),
    status,
  };
}

function answerFor(question: PlanQuestion, answers: PlanAnswers): string {
  const raw = answers[question.need];
  if (raw !== undefined && raw !== SKIP_ANSWER) return flattenTranscriptText(raw, limits.maxAnswerChars);
  return `${question.options[question.defaultOptionIndex] ?? "No answer"} (default)`;
}

export function intakeReply(questions: readonly PlanQuestion[], answers: PlanAnswers): QuestionReplyData {
  const isSkipped = questions.every((question) => {
    const raw = answers[question.need];
    return raw === undefined || raw === SKIP_ANSWER;
  });
  return {
    kind: "intake",
    outcome: isSkipped ? "skipped" : "answered",
    items: questions.slice(0, limits.maxItems).map((question) => ({
      label: question.label,
      text: question.text,
      answer: answerFor(question, answers),
    })),
    moreCount: Math.max(0, questions.length - limits.maxItems),
  };
}
