import type { AssetPurpose, Page, Theme } from "@repo/contracts";
import { MAX_ALT_TEXT_CHARS, MAX_SUGGESTED_PROMPT_CHARS, PURPOSE_STYLE_HINTS } from "./constants";

export function buildSuggestedPrompt(
  purpose: AssetPurpose,
  page: Page,
  theme: Theme,
  componentName = "page",
  domain = "",
): string {
  const hint = PURPOSE_STYLE_HINTS[purpose];
  const business = domain.trim() ? ` for a ${domain.trim()}` : "";
  const prompt =
    `Generate ${hint}${business} for the ${componentName} on ${page.route}. ` +
    `The page is: ${page.purpose}. ${theme.preset} style, primary ${theme.primary}. ` +
    `Show the real subject of this slot, no text overlay.`;
  return prompt.slice(0, MAX_SUGGESTED_PROMPT_CHARS);
}

export function buildAltText(purpose: AssetPurpose, pagePurpose: string, pageRoute = "/"): string {
  return `${purpose} image on ${pageRoute}: ${pagePurpose}`.slice(0, MAX_ALT_TEXT_CHARS);
}
