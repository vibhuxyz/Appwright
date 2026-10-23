import { ElementSelectionSchema, type ElementSelection } from "@repo/contracts";
import { buildSelectionPrompt, locateSelectionSource } from "@repo/selection";
import { isIntakeTurn } from "./current-turn-text";

interface SelectionRow {
  role: string;
  content: string;
  data: unknown;
}

function selectionFromRow(row: SelectionRow): ElementSelection | undefined {
  if (!row.data || typeof row.data !== "object" || !("selection" in row.data)) return undefined;
  const parsed = ElementSelectionSchema.safeParse((row.data as { selection: unknown }).selection);
  return parsed.success ? parsed.data : undefined;
}

function currentTurnRowIndex(rows: readonly SelectionRow[]): number {
  for (let index = rows.length - 1; index >= 0; index--) {
    const row = rows[index];
    if (row && row.role === "user" && !isIntakeTurn(row)) return index;
  }
  return -1;
}

export async function withSelectionApplied<T extends SelectionRow>(
  rows: readonly T[],
  worktreeDir: string,
): Promise<readonly T[]> {
  const index = currentTurnRowIndex(rows);
  const row = index >= 0 ? rows[index] : undefined;
  const selection = row ? selectionFromRow(row) : undefined;
  if (!row || !selection) return rows;

  const candidates = await locateSelectionSource(worktreeDir, selection);
  const augmented: T = { ...row, content: buildSelectionPrompt(row.content, selection, candidates) };
  return rows.map((current, i) => (i === index ? augmented : current));
}
