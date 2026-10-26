import { revertedTurnOf, type RevertedTurn, type SessionTurnRange } from "@repo/contracts";

export type SessionRevertedTurn = RevertedTurn & { readonly sessionId: string };

export function parseRevertedTurns(rows: readonly { sessionId: string; data: unknown }[]): SessionRevertedTurn[] {
  return rows.flatMap((row) => {
    const turn = revertedTurnOf(row.data);
    return turn ? [{ ...turn, sessionId: row.sessionId }] : [];
  });
}

export function toTurnRanges(turns: readonly SessionRevertedTurn[]): SessionTurnRange[] {
  return turns.map(({ sessionId, fromSeq, toSeq }) => ({ sessionId, fromSeq, toSeq }));
}

export function isCreatedInRevertedTurn(
  row: { sessionId: string; createdAt: Date },
  turns: readonly SessionRevertedTurn[],
): boolean {
  const at = row.createdAt.getTime();
  return turns.some(
    (turn) => turn.sessionId === row.sessionId && at >= Date.parse(turn.fromAt) && at <= Date.parse(turn.toAt),
  );
}
