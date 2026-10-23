interface TurnRow {
  role: string;
  content: string;
  data: unknown;
}

export function isIntakeTurn(row: TurnRow): boolean {
  return Boolean(row.data && typeof row.data === "object" && (row.data as { intake?: boolean }).intake === true);
}

export function currentTurnRows<T extends TurnRow>(rows: readonly T[]): readonly T[] {
  for (let index = rows.length - 1; index >= 0; index--) {
    const row = rows[index];
    if (row && row.role === "user" && !isIntakeTurn(row)) return rows.slice(index);
  }
  return rows;
}

export function currentTurnText(rows: readonly TurnRow[]): string {
  return currentTurnRows(rows)
    .map((row) => row.content)
    .join("\n\n");
}
