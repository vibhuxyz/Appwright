import {
  agentQuestionReply,
  formatQuestionReplyContent,
  integrationReply,
  type AgentQuestionResponse,
  type PendingIntegrationRequirement,
} from "@repo/contracts";
import type { LateQuestions } from "../../transcript";
import type { SubmissionPlan } from "./plan-submission";

type ReadyPlan = Extract<SubmissionPlan, { ok: true }>;

export const CONNECTED_FOLLOW_UP = "It is connected now. Please continue.";

export interface LateSource {
  questions: AgentQuestionResponse[];
  requirements: PendingIntegrationRequirement[];
}

export function lateSource(late: LateQuestions, scope: { projectId: string; sessionId: string }): LateSource {
  if (late.kind === "agent") {
    return {
      questions: [{
        id: late.id,
        sessionId: scope.sessionId,
        toolCallId: null,
        status: "PENDING",
        questions: [...late.questions],
        answers: null,
        createdAt: "",
        expiresAt: "",
      }],
      requirements: [],
    };
  }
  return {
    questions: [],
    requirements: late.providers.map((provider) => ({
      id: `${late.id}:${provider}`,
      projectId: scope.projectId,
      sessionId: scope.sessionId,
      provider,
      reason: late.reason,
      status: "PENDING",
      developmentStatus: "missing",
      credentialMode: null,
      lastError: null,
      createdAt: "",
    })),
  };
}

export function lateAnswerMessage(late: LateQuestions, plan: ReadyPlan): string {
  if (late.kind === "agent") {
    return formatQuestionReplyContent(agentQuestionReply(late.questions, plan.answers[0]?.request.answers ?? null));
  }
  const reply = integrationReply(plan.configurations.map((configuration) => ({
    provider: configuration.provider,
    status: "CONNECTED",
    credentialMode: configuration.requests[0]?.credentialMode,
  })));
  return `${formatQuestionReplyContent(reply)}\n\n${CONNECTED_FOLLOW_UP}`;
}
