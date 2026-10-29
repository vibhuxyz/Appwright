import type { MessageRow } from "@repo/agent-core";
import { isIntakeTurn, isQuestionReply } from "../current-turn-text";

export interface HistoryTurn {
  readonly userText: string;
  readonly rows: readonly MessageRow[];
}

function startsTurn(row: MessageRow): boolean {
  return row.role === "user" && row.type === "text" && !isIntakeTurn(row) && !isQuestionReply(row);
}

export function groupTurns(rows: readonly MessageRow[]): HistoryTurn[] {
  const turns: { userText: string; rows: MessageRow[] }[] = [];
  let current: { userText: string; rows: MessageRow[] } | undefined;
  for (const row of rows) {
    if (startsTurn(row)) {
      current = { userText: row.content, rows: [row] };
      turns.push(current);
      continue;
    }
    current?.rows.push(row);
  }
  return turns;
}
