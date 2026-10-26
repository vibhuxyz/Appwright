import {
  AskUserArgsSchema,
  RequestIntegrationArgsSchema,
  RequestableIntegrationProviderSchema,
  type QuestionSetKind,
} from "@repo/contracts";
import type { Msg } from "../schemas/agentSchemas";
import { QUESTION_TOOL_NAMES } from "./constants";
import type { LateQuestions } from "./types";

function isPrompt(msg: Msg): boolean {
  return msg.role === "user" && !msg.data?.questionReply && msg.data?.intake !== true;
}

function agentSource(msg: Msg, id: string): LateQuestions | null {
  if (msg.data?.toolName !== QUESTION_TOOL_NAMES.askUser) return null;
  const parsed = AskUserArgsSchema.safeParse(msg.data.args);
  return parsed.success ? { kind: "agent", id, questions: parsed.data.questions } : null;
}

function integrationSource(msg: Msg, id: string): LateQuestions | null {
  if (msg.data?.toolName === QUESTION_TOOL_NAMES.requestIntegration) {
    const parsed = RequestIntegrationArgsSchema.safeParse(msg.data.args);
    return parsed.success ? { kind: "integration", id, providers: [parsed.data.provider], reason: parsed.data.reason } : null;
  }
  const set = msg.data?.questionSet;
  if (set?.kind !== "integration") return null;
  const providers = set.items.flatMap((item) => {
    const provider = RequestableIntegrationProviderSchema.safeParse(item.key);
    return provider.success ? [provider.data] : [];
  });
  return providers.length > 0 ? { kind: "integration", id, providers, reason: set.intro } : null;
}

function sourceBefore(messages: readonly Msg[], replyIndex: number, kind: QuestionSetKind, id: string): LateQuestions | null {
  for (let index = replyIndex - 1; index >= 0; index--) {
    const msg = messages[index];
    if (!msg || isPrompt(msg)) return null;
    const source = kind === "agent" ? agentSource(msg, id) : integrationSource(msg, id);
    if (source) return source;
  }
  return null;
}

export function findLateQuestions(messages: readonly Msg[]): LateQuestions | null {
  for (let index = messages.length - 1; index >= 0; index--) {
    const msg = messages[index];
    if (!msg || isPrompt(msg)) return null;
    const reply = msg.data?.questionReply;
    if (!reply) continue;
    const isLate = reply.outcome === "skipped" && (reply.kind === "agent" || reply.kind === "integration");
    return isLate ? sourceBefore(messages, index, reply.kind, `late:${msg.id}`) : null;
  }
  return null;
}
