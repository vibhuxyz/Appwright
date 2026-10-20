import type { AssetPurpose, Page, Theme } from "@repo/contracts";
import { MAX_ALT_TEXT_CHARS, MAX_SUGGESTED_PROMPT_CHARS, PURPOSE_STYLE_HINTS } from "./constants";

export function buildSuggestedPrompt(purpose: AssetPurpose, page: Page, theme: Theme): string {
  const hint = PURPOSE_STYLE_HINTS[purpose];
  const prompt =
    `Generate ${hint} for a ${theme.preset} styled page about: ${page.purpose}. ` +
    `Primary color ${theme.primary}. Clean, professional, web-ready, no text overlay.`;
  return prompt.slice(0, MAX_SUGGESTED_PROMPT_CHARS);
}

export function buildAltText(purpose: AssetPurpose, pagePurpose: string): string {
  return `${purpose} image for ${pagePurpose}`.slice(0, MAX_ALT_TEXT_CHARS);
}
