interface TurnRow {
  role: string;
  content: string;
  data: unknown;
}

function isIntakeTurn(row: TurnRow): boolean {
  return Boolean(row.data && typeof row.data === "object" && (row.data as { intake?: boolean }).intake === true);
}

export function currentTurnText(rows: readonly TurnRow[]): string {
  const turn: string[] = [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (!row) break;
    turn.unshift(row.content);
    if (row.role === "user" && !isIntakeTurn(row)) break;
  }
  return turn.join("\n\n");
}
