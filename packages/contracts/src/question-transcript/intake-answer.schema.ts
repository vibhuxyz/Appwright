import { z } from "zod";
import { QUESTION_TRANSCRIPT_LIMITS } from "./constants";

const limits = QUESTION_TRANSCRIPT_LIMITS;

export const IntakeAnswerSchema = z.object({
  need: z.string().min(1).max(limits.maxKeyChars),
  answer: z.string().max(limits.maxAnswerChars),
  source: z.enum(["user", "default", "skip"]),
});
export type IntakeAnswer = z.infer<typeof IntakeAnswerSchema>;

export const IntakeAnswersSchema = z.array(IntakeAnswerSchema).max(limits.maxItems);

export const IntakeAnswersDataSchema = z.object({ answers: IntakeAnswersSchema });

export function answersByNeed(answers: readonly IntakeAnswer[]): Record<string, string> {
  const entries = answers.filter((answer) => answer.source !== "skip").map((answer) => [answer.need, answer.answer]);
  return Object.fromEntries(entries);
}
