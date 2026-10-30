import type { AssetPurpose, Page, Theme } from "@repo/contracts";
import { MAX_ALT_TEXT_CHARS, MAX_SUGGESTED_PROMPT_CHARS, PURPOSE_STYLE_HINTS } from "./constants";

const MAX_TOPIC_WORDS = 8;
const LAYOUT_WORDS: ReadonlySet<string> = new Set([
  "hero", "section", "sections", "grid", "banner", "nav", "navigation", "card", "cards", "footer", "header", "modal", "form", "list", "item", "items",
  "stage", "scroll", "sticky", "story", "split", "image", "images", "bento", "contact", "details", "category", "showcase", "top", "gallery", "block",
  "component", "page", "layout", "row", "rail", "strip", "bar", "button", "cta", "menu", "overlay", "editorial", "promo", "mosaic", "index",
]);

function pageTopics(page: Page): string {
  const words = page.components
    .flatMap((name) => name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[\s._-]+/))
    .map((word) => word.toLowerCase())
    .filter((word) => word.length > 2 && !LAYOUT_WORDS.has(word));
  return [...new Set(words)].slice(0, MAX_TOPIC_WORDS).join(", ");
}

export function buildSuggestedPrompt(
  purpose: AssetPurpose,
  page: Page,
  theme: Theme,
  componentName = "page",
  domain = "",
): string {
  const hint = PURPOSE_STYLE_HINTS[purpose];
  const business = domain.trim() ? ` for a ${domain.trim()}` : "";
  const topics = pageTopics(page);
  const prompt =
    `Generate ${hint}${business} for the ${componentName} on ${page.route}. ` +
    `The page is: ${page.purpose}${topics ? `. Topics: ${topics}` : ""}. ${theme.preset} style, primary ${theme.primary}. ` +
    `Show the real subject of this slot, no text overlay.`;
  return prompt.slice(0, MAX_SUGGESTED_PROMPT_CHARS);
}

export function buildAltText(purpose: AssetPurpose, pagePurpose: string, pageRoute = "/"): string {
  return `${purpose} image on ${pageRoute}: ${pagePurpose}`.slice(0, MAX_ALT_TEXT_CHARS);
}
