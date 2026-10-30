import type { AssetPurpose, AssetSlot } from "@repo/contracts";

const MAX_QUERY_CHARS = 120;
const MAX_QUERY_WORDS = 8;
const DOMAIN_PATTERN = /\bfor an? (.+?) for the /i;
const PAGE_SUBJECT_PATTERN = /The page is: (.*?)(?:\. \S+ style, primary|$)/is;

const FILLER_WORDS: ReadonlySet<string> = new Set([
  "a", "an", "and", "the", "of", "for", "to", "in", "on", "with", "our", "your", "their", "its", "is", "are", "that", "this", "from", "by", "as",
  "page", "pages", "site", "website", "landing", "single", "home", "homepage", "section", "image", "images", "photo", "photos", "showcase", "showcasing",
  "unified", "premium", "award", "winning", "modern", "design", "led", "group", "company", "firm", "business", "brand",
]);

const PURPOSE_SUFFIX: Readonly<Partial<Record<AssetPurpose, string>>> = {
  hero: "wide photograph",
  banner: "wide photograph",
  gallery: "photograph",
  photo: "photograph",
  avatar: "portrait",
};

function isProperNoun(token: string, index: number): boolean {
  return index > 0 && /^[A-Z]/.test(token);
}

function wordsOf(text: string): string[] {
  return text
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter((token, index) => !isProperNoun(token, index))
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !FILLER_WORDS.has(word));
}

export function stockSearchWords(slot: Pick<AssetSlot, "suggestedPrompt">): string[] {
  const domain = DOMAIN_PATTERN.exec(slot.suggestedPrompt)?.[1] ?? "";
  const subject = PAGE_SUBJECT_PATTERN.exec(slot.suggestedPrompt)?.[1] ?? "";
  return [...new Set([...wordsOf(domain), ...wordsOf(subject)])].slice(0, MAX_QUERY_WORDS);
}

export function stockSearchQuery(slot: Pick<AssetSlot, "purpose" | "suggestedPrompt">): string {
  const words = stockSearchWords(slot);
  if (words.length === 0) return "";
  const suffix = PURPOSE_SUFFIX[slot.purpose];
  return [...words, ...(suffix ? [suffix] : [])].join(" ").slice(0, MAX_QUERY_CHARS);
}
