import type { QuestionSetKind } from "@repo/contracts";
import type { Msg } from "../schemas/agentSchemas";
import { cardFromSet, cardFromToolCall, isQuestionToolCall } from "./question-card-model";
import type { QuestionCardStatus, TranscriptItem } from "./types";

type AgentItem = Extract<TranscriptItem, { kind: "agent" }> & { calls: Msg[] };

function isNewPrompt(msg: Msg): boolean {
  return msg.role === "user" && !msg.data?.questionReply && msg.data?.intake !== true && !msg.data?.verificationRetry;
}

function setStatus(messages: readonly Msg[], index: number, kind: QuestionSetKind): QuestionCardStatus {
  for (const later of messages.slice(index + 1)) {
    const reply = later.data?.questionReply;
    if (reply?.kind === kind) return reply.outcome;
    if (isNewPrompt(later)) return "skipped";
  }
  return "waiting";
}

function themeItems(msg: Msg, theme: NonNullable<NonNullable<Msg["data"]>["theme"]>): TranscriptItem[] {
  const feedback = msg.data?.planFeedback ?? [];
  const isApproved = Boolean(msg.data?.blueprintId);
  const decision: TranscriptItem[] = feedback.length > 0 || isApproved ? [{ kind: "plan-decision", id: `${msg.id}:plan`, feedback, isApproved }] : [];
  return [...decision, { kind: "theme-choice", id: msg.id, theme }];
}

function userItems(msg: Msg): TranscriptItem[] {
  if (msg.data?.verificationRetry) return [{ kind: "retry", id: msg.id, msg }];
  if (msg.data?.theme) return themeItems(msg, msg.data.theme);
  const reply = msg.data?.questionReply;
  return [reply ? { kind: "reply", id: msg.id, reply } : { kind: "user", id: msg.id, msg }];
}

function standaloneItems(
  messages: readonly Msg[],
  index: number,
  results: ReadonlyMap<string | undefined, string>,
): TranscriptItem[] {
  const msg = messages[index];
  if (!msg) return [];
  if (msg.role === "user") return userItems(msg);
  const set = msg.data?.questionSet;
  if (msg.type === "text" && set) return [{ kind: "question", id: msg.id, card: cardFromSet(set, setStatus(messages, index, set.kind)) }];
  if (!isQuestionToolCall(msg)) return [];
  const card = cardFromToolCall(msg, results.get(msg.data?.toolCallId));
  return card ? [{ kind: "question", id: msg.id, card }] : [];
}

function newAgentBlock(msg: Msg): AgentItem {
  return msg.type === "toolCall"
    ? { kind: "agent", id: msg.id, text: null, calls: [msg], isTurnEnd: false }
    : { kind: "agent", id: msg.id, text: msg, calls: [], isTurnEnd: false };
}

function markTurnEnds(items: readonly TranscriptItem[]): TranscriptItem[] {
  return items.map((item, index) => {
    if (item.kind !== "agent" || !item.text) return item;
    const next = items[index + 1];
    return { ...item, isTurnEnd: !next || next.kind === "user", isSuperseded: next?.kind === "retry" };
  });
}

export function buildTranscriptItems(messages: readonly Msg[]): TranscriptItem[] {
  const results = new Map(messages.filter((msg) => msg.type === "toolResponse").map((msg) => [msg.data?.toolCallId, msg.content]));
  const items: TranscriptItem[] = [];
  let block: AgentItem | null = null;
  for (const [index, msg] of messages.entries()) {
    if (msg.type === "toolResponse") continue;
    const standalone = standaloneItems(messages, index, results);
    if (standalone.length > 0) {
      items.push(...standalone);
      block = null;
    } else if (msg.type === "toolCall" && block) {
      block.calls.push(msg);
    } else {
      block = newAgentBlock(msg);
      items.push(block);
    }
  }
  return markTurnEnds(items);
}
