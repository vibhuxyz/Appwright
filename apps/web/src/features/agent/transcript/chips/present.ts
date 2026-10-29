import type { Msg } from "../../schemas/agentSchemas";
import type { TranscriptItem } from "../types";

const DELEGATED = /^Delegated to ([^:]+?)(?::|$)/;
const STATUS_LABELS: ReadonlySet<string> = new Set(["Memory Fetched", "Listing your available API keys"]);

export interface HandoffCard {
  readonly title: string;
  readonly bullets: readonly string[];
  readonly note?: string;
  readonly createdPath?: string;
}

export interface AgentPresentation {
  readonly text: string | null;
  readonly delegation: string | null;
  readonly statusLabel: string | null;
  readonly handoff: HandoffCard | null;
}

export function delegationAgent(text: string): string | undefined {
  return DELEGATED.exec(text.trim())?.[1]?.trim();
}

function createdPath(content: string): string | undefined {
  const match = /^Created (\/\S+)/.exec(content);
  return match?.[1];
}

function handoffCard(message: Msg): HandoffCard | null {
  const title = message.data?.summaryTitle;
  if (!title) return null;
  const note = message.data?.summaryNote;
  const path = createdPath(message.content);
  return {
    title,
    bullets: message.data?.summaryBullets ?? [],
    ...(note ? { note } : {}),
    ...(path ? { createdPath: path } : {}),
  };
}

function agentName(item: Extract<TranscriptItem, { kind: "agent" }>): string | undefined {
  if (!item.text) return undefined;
  return item.text.data?.delegation ?? delegationAgent(item.text.content);
}

export function visibleTranscriptItems(items: readonly TranscriptItem[], agent: string | null): TranscriptItem[] {
  if (!agent) return [...items];
  const kept: TranscriptItem[] = [];
  let active = false;
  for (const item of items) {
    if (item.kind !== "agent") {
      kept.push(item);
      continue;
    }
    const name = agentName(item);
    if (name) active = name === agent;
    if (active) kept.push(item);
  }
  return kept;
}

export function presentAgentText(message: Msg | null): AgentPresentation {
  if (!message) return { text: null, delegation: null, statusLabel: null, handoff: null };
  const content = message.content.trim();
  const handoff = handoffCard(message);
  const fromLine = delegationAgent(content);
  const delegation = message.data?.delegation ?? fromLine ?? null;
  const statusLabel = STATUS_LABELS.has(content) ? content : null;
  const hideText = handoff !== null || fromLine !== undefined || statusLabel !== null;
  return { text: hideText ? null : message.content, delegation, statusLabel, handoff };
}
