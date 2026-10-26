import {
  AgentQuestionListResponseSchema,
  AnswerAgentQuestionRequestSchema,
  type AgentQuestionResponse,
  type AnswerAgentQuestionRequest,
} from "@repo/contracts";
import { httpClient } from "@/shared/lib/httpClient";

export const agentQuestionsApi = {
  listPending: (sessionId: string, signal?: AbortSignal): Promise<AgentQuestionResponse[]> =>
    httpClient
      .get(`/v1/sessions/${encodeURIComponent(sessionId)}/agent-questions`, signal)
      .then((response) => AgentQuestionListResponseSchema.parse(response).items),

  answer: (questionId: string, input: AnswerAgentQuestionRequest): Promise<unknown> =>
    httpClient.post(
      `/v1/agent-questions/${encodeURIComponent(questionId)}/answers`,
      AnswerAgentQuestionRequestSchema.parse(input),
    ),
};
