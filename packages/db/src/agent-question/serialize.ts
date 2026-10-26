import {
  AgentQuestionAnswerSchema,
  AgentQuestionItemSchema,
  AgentQuestionStatusSchema,
  type AgentQuestionResponse,
} from "@repo/contracts";
import { z } from "zod";

const StoredQuestionsSchema = z.array(AgentQuestionItemSchema);
const StoredAnswersSchema = z.array(AgentQuestionAnswerSchema).nullable();

export interface AgentQuestionRow {
  id: string;
  sessionId: string;
  toolCallId: string | null;
  status: string;
  questions: unknown;
  answers: unknown;
  createdAt: Date;
  expiresAt: Date;
}

export function toAgentQuestionResponse(row: AgentQuestionRow): AgentQuestionResponse | null {
  const status = AgentQuestionStatusSchema.safeParse(row.status);
  const questions = StoredQuestionsSchema.safeParse(row.questions);
  const answers = StoredAnswersSchema.safeParse(row.answers ?? null);
  if (!status.success || !questions.success || !answers.success) return null;
  return {
    id: row.id,
    sessionId: row.sessionId,
    toolCallId: row.toolCallId,
    status: status.data,
    questions: questions.data,
    answers: answers.data,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}
