import { useQuery } from "@tanstack/react-query";
import type { AgentQuestionResponse, PendingIntegrationRequirement } from "@repo/contracts";
import { usePendingIntegrations } from "@/features/environment";
import { agentQuestionKeys, agentQuestionsApi } from "../api";

const QUESTIONS_STALE_TIME_MS = 5_000;
const NO_QUESTIONS: readonly AgentQuestionResponse[] = [];
const NO_REQUIREMENTS: readonly PendingIntegrationRequirement[] = [];

export function usePendingAgentQuestions(sessionId: string | undefined) {
  return useQuery({
    queryKey: agentQuestionKeys.pending(sessionId ?? ""),
    queryFn: ({ signal }) => agentQuestionsApi.listPending(sessionId ?? "", signal),
    enabled: Boolean(sessionId),
    staleTime: QUESTIONS_STALE_TIME_MS,
  });
}

export function usePendingDockItems(projectId: string, sessionId: string | undefined) {
  const questionsQuery = usePendingAgentQuestions(sessionId);
  const requirementsQuery = usePendingIntegrations(projectId, sessionId);
  const questions = questionsQuery.data ?? NO_QUESTIONS;
  const requirements = requirementsQuery.data ?? NO_REQUIREMENTS;
  return {
    questions,
    requirements,
    hasPending: questions.length > 0 || requirements.length > 0,
  };
}
