import { z } from "zod";
import { QUESTION_REPLY_OUTCOMES, QUESTION_SET_KINDS, QUESTION_TRANSCRIPT_LIMITS } from "./constants";

const limits = QUESTION_TRANSCRIPT_LIMITS;
const label = z.string().min(1).max(limits.maxLabelChars);
const text = z.string().min(1).max(limits.maxTextChars);

export const QuestionSetKindSchema = z.enum(QUESTION_SET_KINDS);
export type QuestionSetKind = z.infer<typeof QuestionSetKindSchema>;

export const QuestionSetItemSchema = z.object({
  key: z.string().min(1).max(limits.maxKeyChars).optional(),
  label,
  text,
  options: z.array(z.string().min(1).max(limits.maxOptionChars)).max(limits.maxOptions),
});
export type QuestionSetItem = z.infer<typeof QuestionSetItemSchema>;

export const QuestionSetDataSchema = z.object({
  kind: QuestionSetKindSchema,
  intro: z.string().max(limits.maxIntroChars),
  items: z.array(QuestionSetItemSchema).min(1).max(limits.maxItems),
  moreCount: z.number().int().min(0).default(0),
});
export type QuestionSetData = z.infer<typeof QuestionSetDataSchema>;

export const QuestionReplyOutcomeSchema = z.enum(QUESTION_REPLY_OUTCOMES);
export type QuestionReplyOutcome = z.infer<typeof QuestionReplyOutcomeSchema>;

export const QuestionReplyItemSchema = z.object({
  label,
  text,
  answer: z.string().min(1).max(limits.maxAnswerChars),
});
export type QuestionReplyItem = z.infer<typeof QuestionReplyItemSchema>;

export const QuestionReplyDataSchema = z.object({
  kind: QuestionSetKindSchema,
  outcome: QuestionReplyOutcomeSchema,
  items: z.array(QuestionReplyItemSchema).max(limits.maxItems),
  moreCount: z.number().int().min(0).default(0),
});
export type QuestionReplyData = z.infer<typeof QuestionReplyDataSchema>;
