import { z } from "zod";
import { HANDOFF_DISPLAY_PATH, MAX_SUMMARY_CHARS } from "./constants";

const JSON_FENCE = /^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```[ \t]*$/;
const SummaryBody = z.object({ summary: z.string() });

function clip(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= MAX_SUMMARY_CHARS ? flat : `${flat.slice(0, MAX_SUMMARY_CHARS - 1).trimEnd()}…`;
}

function readJson(source: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(source) };
  } catch (error) {
    if (error instanceof SyntaxError) return { ok: false };
    throw error;
  }
}

export function parseHandoffSummary(text: string): string | undefined {
  const trimmed = text.trim();
  const fenced = JSON_FENCE.exec(trimmed);
  const parsed = readJson((fenced?.[1] ?? trimmed).trim());
  if (!parsed.ok) return undefined;
  const result = SummaryBody.safeParse(parsed.value);
  if (!result.success) return undefined;
  const summary = clip(result.data.summary);
  return summary.length > 0 ? summary : undefined;
}

export function handoffMessage(wrote: boolean, summary: string | undefined): string {
  const line = wrote ? `Created ${HANDOFF_DISPLAY_PATH}` : "Handoff Agent did not write the memory file.";
  return summary ? `${line}\n\n${summary}` : line;
}
