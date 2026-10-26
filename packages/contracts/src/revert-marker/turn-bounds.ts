const NON_PROMPT_KEYS = ["intake", "questionReply", "transcriptOnly", "verificationRetry"] as const;

export interface TurnRow {
  readonly seq: number;
  readonly role: string;
  readonly type: string;
  readonly data: unknown;
}

export interface SessionSeqRow {
  readonly sessionId: string;
  readonly seq: number;
}

export interface SessionTurnRange {
  readonly sessionId: string;
  readonly fromSeq: number;
  readonly toSeq: number;
}

export function isUserPromptRow(row: TurnRow): boolean {
  if (row.role !== "user" || row.type !== "text") return false;
  if (typeof row.data !== "object" || row.data === null) return false;
  const data = row.data;
  return !NON_PROMPT_KEYS.some((key) => key in data);
}

export function turnStartSeq(rows: readonly TurnRow[], endSeq: number): number | undefined {
  let start: number | undefined;
  for (const row of rows) {
    if (row.seq > endSeq) break;
    if (isUserPromptRow(row)) start = row.seq;
  }
  return start;
}

export function isInRevertedTurn(row: SessionSeqRow, turns: readonly SessionTurnRange[]): boolean {
  return turns.some((turn) => turn.sessionId === row.sessionId && row.seq >= turn.fromSeq && row.seq <= turn.toSeq);
}
