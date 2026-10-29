import type { ProjectMemoryRows } from "@repo/contracts";
import { isPureChat, isVerificationTranscript, looksLikeSnippet, summarizeTurns, type SummaryTurn } from "../transcript";

type UserRow = ProjectMemoryRows["userRows"][number];
type AssistantRow = ProjectMemoryRows["assistantRows"][number];

const MIN_ASSISTANT_CHARS = 24;

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === "object" && data !== null;
}

function byAge(left: { createdAt: Date; seq: number }, right: { createdAt: Date; seq: number }): number {
  const delta = left.createdAt.getTime() - right.createdAt.getTime();
  return delta !== 0 ? delta : left.seq - right.seq;
}

function isSummaryPrompt(row: UserRow): boolean {
  if (!isRecord(row.data)) return false;
  if ("intake" in row.data || "questionReply" in row.data || "transcriptOnly" in row.data) return false;
  return !isVerificationTranscript(row.data, row.content) && !isPureChat(row.content) && !looksLikeSnippet(row.content);
}

function isMarker(data: unknown): boolean {
  return typeof data === "object" && data !== null && ("transcriptOnly" in data || "revertMarker" in data);
}

function assistantReply(user: UserRow, assistants: readonly AssistantRow[]): string | undefined {
  return assistants
    .filter((row) => row.sessionId === user.sessionId && row.seq > user.seq && !isMarker(row.data) && (row.content?.trim().length ?? 0) >= MIN_ASSISTANT_CHARS)
    .sort((left, right) => left.seq - right.seq)[0]?.content;
}

export function summarizeMemory(userRows: readonly UserRow[], assistantRows: readonly AssistantRow[]): string {
  const turns: SummaryTurn[] = userRows.filter(isSummaryPrompt).sort(byAge).map((row) => ({
    user: row.content,
    assistant: assistantReply(row, assistantRows),
  }));
  return summarizeTurns(turns);
}
