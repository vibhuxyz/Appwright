import { z } from "zod";
import { CHANGE_TOOLS, READ_TOOL } from "./constants";

const ToolCallDataSchema = z.object({
  toolName: z.string(),
  args: z.object({ path: z.string() }),
});

export interface WorkLedger {
  readonly changed: readonly (readonly [path: string, count: number])[];
  readonly readOnly: readonly string[];
}

const LEADING_CURRENT_DIR = /^(?:\.\/)+/;

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(LEADING_CURRENT_DIR, "");
}

export function buildWorkLedger(rows: readonly { type: string; data: unknown }[]): WorkLedger {
  const changeCounts = new Map<string, number>();
  const read = new Set<string>();
  for (const row of rows) {
    if (row.type !== "toolCall") continue;
    const parsed = ToolCallDataSchema.safeParse(row.data);
    if (!parsed.success) continue;
    const path = normalizePath(parsed.data.args.path);
    if (CHANGE_TOOLS.has(parsed.data.toolName)) changeCounts.set(path, (changeCounts.get(path) ?? 0) + 1);
    if (parsed.data.toolName === READ_TOOL) read.add(path);
  }
  const changed = [...changeCounts.entries()].sort(([a], [b]) => a.localeCompare(b));
  const readOnly = [...read].filter((path) => !changeCounts.has(path)).sort((a, b) => a.localeCompare(b));
  return { changed, readOnly };
}
