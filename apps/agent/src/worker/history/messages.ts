import {
  compactEarlierTurns,
  isTranscriptOnlyRow,
  isVerificationTranscript,
  toCoreMessage,
  type Message as CoreMessage,
  type MessageRow,
} from "@repo/agent-core";
import { isInRevertedTurn, revertedTurnOf, type SessionTurnRange } from "@repo/contracts";
import { groupTurns } from "./group-turns";
import { selectRecentTurns } from "./select-turns";

function revertedRanges(rows: readonly MessageRow[]): SessionTurnRange[] {
  return rows.flatMap((row) => {
    const turn = revertedTurnOf(row.data);
    return turn ? [{ sessionId: row.sessionId, fromSeq: turn.fromSeq, toSeq: turn.toSeq }] : [];
  });
}

export function historyMessages(rows: readonly MessageRow[]): CoreMessage[] {
  const reverted = revertedRanges(rows);
  const visible = rows.filter(
    (row) => !isInRevertedTurn(row, reverted) && !isTranscriptOnlyRow(row) && !isVerificationTranscript(row.data, row.content),
  );
  const kept = selectRecentTurns(groupTurns(visible));
  const current = kept[kept.length - 1];
  if (!current) return [];
  const earlier = kept.slice(0, -1).flatMap((turn) => compactEarlierTurns(turn.rows.map(toCoreMessage)));
  return [...earlier, ...current.rows.map(toCoreMessage)];
}
