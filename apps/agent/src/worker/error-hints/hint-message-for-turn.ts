import { extractErrorHints } from "@repo/decision-engine";
import { buildHintMessage } from "./build-hint-message";
import { resolveHints, type SkippedHint } from "./resolve-hints";

export interface TurnHintMessage {
  message: string | null;
  skipped: SkippedHint[];
}

export async function hintMessageForTurn(turnText: string, worktreeDir: string): Promise<TurnHintMessage> {
  const hints = extractErrorHints(turnText);
  if (hints.files.length === 0) return { message: null, skipped: [] };
  const { files, skipped } = await resolveHints(worktreeDir, hints.files);
  const message = files.length > 0 ? buildHintMessage(files, hints.errorLines) : null;
  return { message, skipped };
}
