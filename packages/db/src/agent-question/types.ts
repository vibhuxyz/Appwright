import type { AgentQuestionAnswer, AgentQuestionResponse } from "@repo/contracts";

export type AnswerValidation = { ok: true } | { ok: false; message: string };

export type ResolveAgentQuestionResult =
  | { ok: true }
  | { ok: false; reason: "ALREADY_RESOLVED" };

export interface AgentQuestionOutcome {
  status: AgentQuestionResponse["status"];
  answers: AgentQuestionAnswer[] | null;
}

export interface SkippedAgentQuestion {
  id: string;
  reason: string;
}
