import { SECTION_TAG } from "./constants";
import type { ContextSection } from "./types";

const CLOSING_TAG = `</${SECTION_TAG}>`;
const ESCAPED_CLOSING_TAG = `<\\/${SECTION_TAG}>`;
const UNSAFE_ATTRIBUTE_CHARS = /["<>]/g;
const WHITESPACE = /\s+/g;

function flattenAttribute(value: string): string {
  return value.replace(WHITESPACE, " ").replace(UNSAFE_ATTRIBUTE_CHARS, "_").trim();
}

export function renderSection(section: ContextSection): string {
  const body = section.body.replaceAll(CLOSING_TAG, ESCAPED_CLOSING_TAG);
  const source = flattenAttribute(section.source);
  return `<${SECTION_TAG} kind="${section.kind}" source="${source}">\n${body}\n${CLOSING_TAG}`;
}
