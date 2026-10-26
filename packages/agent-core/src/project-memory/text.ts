import { MAX_ITEM_CHARS, PROJECT_MEMORY_TAG } from "./constants";

const CLOSE_TAG = `</${PROJECT_MEMORY_TAG}>`;
const ESCAPED_CLOSE_TAG = `<\\/${PROJECT_MEMORY_TAG}>`;
const ISO_DATE_LENGTH = 10;

export function flatten(text: string, maxChars: number = MAX_ITEM_CHARS): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const capped = flat.length > maxChars ? `${flat.slice(0, maxChars)}…` : flat;
  return capped.replaceAll(CLOSE_TAG, ESCAPED_CLOSE_TAG);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}

export function section(heading: string, items: readonly string[], limit: number): string[] {
  if (items.length === 0) return [];
  const shown = items.slice(0, limit).map((item) => `- ${item}`);
  const hidden = items.length - shown.length;
  return [heading, ...shown, ...(hidden > 0 ? [`(+${hidden} more)`] : [])];
}
