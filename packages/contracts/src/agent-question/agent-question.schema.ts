import { z } from "zod";
import {
  AGENT_QUESTION_INPUT_TYPES,
  AGENT_QUESTION_LIMITS,
  AGENT_QUESTION_STATUSES,
} from "./constants";

const optionText = z.string().trim().min(1).max(AGENT_QUESTION_LIMITS.maxOptionChars);

export const AgentQuestionItemSchema = z
  .object({
    label: z.string().trim().min(1).max(AGENT_QUESTION_LIMITS.maxLabelChars),
    text: z.string().trim().min(1).max(AGENT_QUESTION_LIMITS.maxTextChars),
    options: z.array(optionText).min(AGENT_QUESTION_LIMITS.minOptions).max(AGENT_QUESTION_LIMITS.maxOptions),
    defaultOptionIndex: z.number().int().min(0),
    inputType: z.enum(AGENT_QUESTION_INPUT_TYPES),
  })
  .refine((question) => question.defaultOptionIndex < question.options.length, {
    path: ["defaultOptionIndex"],
    message: "defaultOptionIndex must point at one of the options",
  });
export type AgentQuestionItem = z.infer<typeof AgentQuestionItemSchema>;

export const AskUserArgsSchema = z.object({
  questions: z.array(AgentQuestionItemSchema).min(1).max(AGENT_QUESTION_LIMITS.maxQuestions),
});
export type AskUserArgs = z.infer<typeof AskUserArgsSchema>;

export const AgentQuestionAnswerSchema = z.object({
  selectedOptionIndexes: z.array(z.number().int().min(0)).max(AGENT_QUESTION_LIMITS.maxOptions),
  otherText: z.string().trim().max(AGENT_QUESTION_LIMITS.maxOtherTextChars).optional(),
});
export type AgentQuestionAnswer = z.infer<typeof AgentQuestionAnswerSchema>;

export const AnswerAgentQuestionRequestSchema = z.object({
  answers: z.array(AgentQuestionAnswerSchema).min(1).max(AGENT_QUESTION_LIMITS.maxQuestions),
});
export type AnswerAgentQuestionRequest = z.infer<typeof AnswerAgentQuestionRequestSchema>;

export const AgentQuestionStatusSchema = z.enum(AGENT_QUESTION_STATUSES);
export type AgentQuestionStatus = z.infer<typeof AgentQuestionStatusSchema>;

export const AgentQuestionResponseSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  toolCallId: z.string().nullable(),
  status: AgentQuestionStatusSchema,
  questions: z.array(AgentQuestionItemSchema),
  answers: z.array(AgentQuestionAnswerSchema).nullable(),
  createdAt: z.string(),
  expiresAt: z.string(),
});
export type AgentQuestionResponse = z.infer<typeof AgentQuestionResponseSchema>;

export const AgentQuestionListResponseSchema = z.object({
  items: z.array(AgentQuestionResponseSchema),
});
export type AgentQuestionListResponse = z.infer<typeof AgentQuestionListResponseSchema>;
