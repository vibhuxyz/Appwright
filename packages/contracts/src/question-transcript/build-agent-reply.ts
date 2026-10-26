import type { AgentQuestionAnswer, AgentQuestionItem } from "../agent-question";
import { QUESTION_TRANSCRIPT_LIMITS } from "./constants";
import type { QuestionReplyData } from "./question-transcript.schema";
import { flattenTranscriptText } from "./transcript-text";

const limits = QUESTION_TRANSCRIPT_LIMITS;

function answerText(question: AgentQuestionItem, answer: AgentQuestionAnswer | undefined): string {
  const chosen = (answer?.selectedOptionIndexes ?? []).flatMap((index) => {
    const option = question.options[index];
    return option ? [option] : [];
  });
  const own = answer?.otherText?.trim();
  const parts = own ? [...chosen, own] : chosen;
  const fallback = question.options[question.defaultOptionIndex] ?? question.options[0] ?? "Default";
  return flattenTranscriptText(parts.length > 0 ? parts.join("; ") : fallback, limits.maxAnswerChars);
}

export function agentQuestionReply(
  questions: readonly AgentQuestionItem[],
  answers: readonly AgentQuestionAnswer[] | null,
): QuestionReplyData {
  if (!answers) return { kind: "agent", outcome: "skipped", items: [], moreCount: 0 };
  return {
    kind: "agent",
    outcome: "answered",
    items: questions.slice(0, limits.maxItems).map((question, index) => ({
      label: flattenTranscriptText(question.label, limits.maxLabelChars),
      text: flattenTranscriptText(question.text, limits.maxTextChars),
      answer: answerText(question, answers[index]),
    })),
    moreCount: Math.max(0, questions.length - limits.maxItems),
  };
}
