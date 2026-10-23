import { z } from "zod";
import { PLAN_SUMMARY_LIMITS, PlanSummarySchema } from "../plan-summary";
import { PromptAnswerValue, PromptQuestionSchema } from "../session.schema";

export const PLAN_PREVIEW_LIMITS = {
  maxPromptChars: 4000,
  maxFeedbackChars: 1000,
  maxEntities: 12,
  maxQuestions: 24,
} as const;

export const PlanPreviewRequest = z.object({
  prompt: z.string().trim().min(1).max(PLAN_PREVIEW_LIMITS.maxPromptChars),
  answers: z.record(z.string(), PromptAnswerValue).optional(),
  questions: z.array(PromptQuestionSchema).max(PLAN_PREVIEW_LIMITS.maxQuestions).optional(),
  feedback: z.string().trim().min(1).max(PLAN_PREVIEW_LIMITS.maxFeedbackChars).optional(),
});
export type PlanPreviewRequest = z.infer<typeof PlanPreviewRequest>;

export const PlanPreviewSchema = PlanSummarySchema.extend({
  blueprintId: z.string().min(1),
  entities: z.array(z.string().min(1).max(PLAN_SUMMARY_LIMITS.maxNameChars)).max(PLAN_PREVIEW_LIMITS.maxEntities),
});
export type PlanPreview = z.infer<typeof PlanPreviewSchema>;
