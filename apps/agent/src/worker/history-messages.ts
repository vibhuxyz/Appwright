import {
  compactEarlierTurns,
  isTranscriptOnlyRow,
  toCoreMessage,
  type Message as CoreMessage,
  type MessageRow,
} from "@repo/agent-core";
import { isInRevertedTurn, revertedTurnOf, type SessionTurnRange } from "@repo/contracts";
import { currentTurnRows } from "./current-turn-text";

function revertedRanges(rows: readonly MessageRow[]): SessionTurnRange[] {
  return rows.flatMap((row) => {
    const turn = revertedTurnOf(row.data);
    return turn ? [{ sessionId: row.sessionId, fromSeq: turn.fromSeq, toSeq: turn.toSeq }] : [];
  });
}

export function historyMessages(rows: readonly MessageRow[]): CoreMessage[] {
  const reverted = revertedRanges(rows);
  const live = rows.filter((row) => !isInRevertedTurn(row, reverted));
  const currentStartSeq = currentTurnRows(live)[0]?.seq ?? Number.NEGATIVE_INFINITY;
  const visible = live.filter((row) => !isTranscriptOnlyRow(row));
  const earlier = visible.filter((row) => row.seq < currentStartSeq).map(toCoreMessage);
  const current = visible.filter((row) => row.seq >= currentStartSeq).map(toCoreMessage);
  return [...compactEarlierTurns(earlier), ...current];
}
