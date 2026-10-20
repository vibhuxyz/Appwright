import type { AssetPurpose } from "@repo/contracts";

export const MAX_SUGGESTED_PROMPT_CHARS = 500;
export const MAX_ALT_TEXT_CHARS = 160;

export const PURPOSE_KEYWORDS: ReadonlyArray<{
  readonly purpose: AssetPurpose;
  readonly pattern: RegExp;
}> = [
  { purpose: "hero", pattern: /\bhero\b/i },
  { purpose: "banner", pattern: /\bbanner\b/i },
  { purpose: "avatar", pattern: /\b(avatar|headshot|team photo|profile photo)\b/i },
  { purpose: "gallery", pattern: /\b(gallery|portfolio|showcase)\b/i },
  { purpose: "logo", pattern: /\blogo\b/i },
  { purpose: "background", pattern: /\b(background|backdrop)\b/i },
  { purpose: "icon", pattern: /\bicon\b/i },
  { purpose: "photo", pattern: /\b(photo|picture|product image|thumbnail)\b/i },
];

export const PURPOSE_STYLE_HINTS: Readonly<Record<AssetPurpose, string>> = {
  hero: "a wide hero banner image",
  banner: "a wide promotional banner image",
  avatar: "a square profile avatar photo",
  gallery: "a gallery showcase photo",
  logo: "a simple, clean logo mark",
  background: "a subtle background texture image",
  icon: "a minimal flat icon",
  photo: "a professional photo",
  other: "a supporting image",
};
