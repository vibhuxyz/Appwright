import { z } from "zod";
import { BlueprintSchema, PromptQuestionSchema, TaskSchema } from "@repo/contracts";

export const planTaskSchema = TaskSchema.pick({
  id: true,
  type: true,
  title: true,
  status: true,
  dependsOn: true,
  owns: true,
  reads: true,
  riskTier: true,
  capability: true,
});
export type PlanTask = z.infer<typeof planTaskSchema>;

export const runSchema = z.object({
  id: z.string(),
  status: z.string(),
  tasks: z.array(planTaskSchema),
});
export type Run = z.infer<typeof runSchema>;

export const blueprintSchema = BlueprintSchema;

export const transcriptEntrySchema = z.object({
  role: z.string(),
  text: z.string(),
});
export type TranscriptEntry = z.infer<typeof transcriptEntrySchema>;

export const taskAttemptSchema = z.object({
  id: z.string(),
  attemptNumber: z.number().int(),
  status: z.string(),
  model: z.string(),
  durationMs: z.number().nullable().optional(),
  error: z.string().nullable().optional(),
  transcript: z.array(transcriptEntrySchema).default([]),
});
export type TaskAttempt = z.infer<typeof taskAttemptSchema>;

export const taskAttemptsSchema = z.object({ attempts: z.array(taskAttemptSchema) });

export const planQuestionSchema = PromptQuestionSchema;
export type PlanQuestion = z.infer<typeof planQuestionSchema>;

export const SKIP_ANSWER = "skip" as const;
export type SkipAnswer = typeof SKIP_ANSWER;

export const answerValueSchema = z.union([z.string().min(1).max(1000), z.literal(SKIP_ANSWER)]);
export type AnswerValue = z.infer<typeof answerValueSchema>;

export const planAnswersSchema = z.record(z.string(), answerValueSchema);
export type PlanAnswers = z.infer<typeof planAnswersSchema>;
