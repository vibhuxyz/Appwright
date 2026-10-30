import type { AgentQuestionItem, QuestionReplyData, RequestableIntegrationProvider, ThemeOption } from "@repo/contracts";
import type { Msg } from "../schemas/agentSchemas";

export type QuestionCardStatus = "waiting" | "answered" | "skipped" | "cancelled" | "failed";

export interface QuestionCardItem {
  label: string;
  text: string;
  options: readonly string[];
}

export interface QuestionCardModel {
  intro: string;
  items: readonly QuestionCardItem[];
  moreCount: number;
  status: QuestionCardStatus;
}

export type TranscriptItem =
  | { kind: "user"; id: string; msg: Msg }
  | { kind: "reply"; id: string; reply: QuestionReplyData }
  | { kind: "plan-decision"; id: string; feedback: readonly string[]; isApproved: boolean }
  | { kind: "theme-choice"; id: string; theme: ThemeOption }
  | { kind: "retry"; id: string; msg: Msg }
  | { kind: "agent"; id: string; text: Msg | null; calls: readonly Msg[]; isTurnEnd: boolean; isSuperseded?: boolean }
  | { kind: "question"; id: string; card: QuestionCardModel };

export type LateQuestions =
  | { kind: "agent"; id: string; questions: readonly AgentQuestionItem[] }
  | { kind: "integration"; id: string; providers: readonly RequestableIntegrationProvider[]; reason: string };
