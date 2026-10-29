import { z } from "zod";
import { HANDOFF_DISPLAY_PATH, MAX_SUMMARY_CHARS } from "./constants";

const JSON_FENCE = /^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```[ \t]*$/;
const MAX_BULLETS = 6;
const MAX_TITLE_CHARS = 80;
const MAX_NOTE_CHARS = 200;
const SummaryBody = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  note: z.string().optional(),
});

export interface HandoffSummary {
  readonly title: string;
  readonly bullets: readonly string[];
  readonly note?: string;
}

function clip(text: string, maxChars: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= maxChars ? flat : `${flat.slice(0, maxChars - 1).trimEnd()}…`;
}

function readJson(source: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(source) };
  } catch (error) {
    if (error instanceof SyntaxError) return { ok: false };
    throw error;
  }
}

export function parseHandoffSummary(text: string): HandoffSummary | undefined {
  const trimmed = text.trim();
  const fenced = JSON_FENCE.exec(trimmed);
  const parsed = readJson((fenced?.[1] ?? trimmed).trim());
  if (!parsed.ok) return undefined;
  const result = SummaryBody.safeParse(parsed.value);
  if (!result.success) return undefined;
  const title = clip(result.data.title ?? result.data.summary ?? "", MAX_TITLE_CHARS);
  if (title.length === 0) return undefined;
  const bullets = (result.data.bullets ?? []).map((bullet) => clip(bullet, MAX_SUMMARY_CHARS)).filter((bullet) => bullet.length > 0).slice(0, MAX_BULLETS);
  const note = result.data.note ? clip(result.data.note, MAX_NOTE_CHARS) : "";
  return { title, bullets, ...(note ? { note } : {}) };
}

export function handoffMessage(wrote: boolean, summary: HandoffSummary | undefined): string {
  const line = wrote ? `Created ${HANDOFF_DISPLAY_PATH}` : "Handoff Agent did not write the memory file.";
  if (!summary) return line;
  const bullets = summary.bullets.map((bullet) => `- ${bullet}`);
  return [line, "", summary.title, ...bullets, ...(summary.note ? [summary.note] : [])].join("\n");
}
