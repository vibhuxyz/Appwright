import { isPureChat } from "@repo/agent-core";
import type { HistoryTurn } from "./group-turns";

const KEPT_TURN_COUNT = 2;

export function selectRecentTurns(turns: readonly HistoryTurn[]): HistoryTurn[] {
  if (turns.length === 0) return [];
  const current = turns[turns.length - 1];
  if (!current) return [];
  const previous: HistoryTurn[] = [];
  for (let index = turns.length - 2; index >= 0 && previous.length < KEPT_TURN_COUNT - 1; index -= 1) {
    const turn = turns[index];
    if (!turn || isPureChat(turn.userText)) continue;
    previous.unshift(turn);
  }
  return [...previous, current];
}
