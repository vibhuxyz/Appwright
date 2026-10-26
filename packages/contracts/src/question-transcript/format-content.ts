import { QUESTION_TRANSCRIPT_LIMITS, SKIPPED_REPLY_TEXT } from "./constants";
import type { QuestionReplyData, QuestionSetData, QuestionSetItem } from "./question-transcript.schema";
import { fitToBytes } from "./transcript-text";

const OPTION_LETTERS = "abcdefghijkl";

function moreLine(moreCount: number): string[] {
  return moreCount > 0 ? [`(+${moreCount} more)`] : [];
}

function formatSetItem(item: QuestionSetItem, index: number): string {
  const options = item.options.map((option, optionIndex) => `   ${OPTION_LETTERS[optionIndex] ?? "-"}) ${option}`);
  return [`${index + 1}. ${item.label} — ${item.text}`, ...options].join("\n");
}

export function formatQuestionSetContent(set: QuestionSetData): string {
  const parts = [
    ...(set.intro ? [set.intro] : []),
    ...set.items.map(formatSetItem),
    ...moreLine(set.moreCount),
  ];
  return fitToBytes(parts.join("\n\n"), QUESTION_TRANSCRIPT_LIMITS.maxContentBytes);
}

export function formatQuestionReplyContent(reply: QuestionReplyData): string {
  if (reply.items.length === 0) return SKIPPED_REPLY_TEXT;
  const heading = reply.outcome === "skipped" ? [`${SKIPPED_REPLY_TEXT} — going with these defaults:`] : [];
  const parts = [
    ...heading,
    ...reply.items.map((item) => `${item.label} — ${item.text}\n${item.answer}`),
    ...moreLine(reply.moreCount),
  ];
  return fitToBytes(parts.join("\n\n"), QUESTION_TRANSCRIPT_LIMITS.maxContentBytes);
}
