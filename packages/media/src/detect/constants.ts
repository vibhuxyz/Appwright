import type { AssetPurpose } from "@repo/contracts";

export const MAX_SUGGESTED_PROMPT_CHARS = 500;
export const MAX_ALT_TEXT_CHARS = 160;

export const PURPOSE_KEYWORDS: ReadonlyArray<{
  readonly purpose: AssetPurpose;
  readonly pattern: RegExp;
}> = [
  { purpose: "hero", pattern: /\bhero\b/i },
  { purpose: "banner", pattern: /\bbanner\b/i },
  { purpose: "avatar", pattern: /\b(avatar|headshot|team|staff|profile photo|testimonial|review)\b/i },
  { purpose: "gallery", pattern: /\b(gallery|portfolio|showcase|carousel|slider)\b/i },
  { purpose: "logo", pattern: /\blogo\b/i },
  { purpose: "background", pattern: /\b(background|backdrop)\b/i },
  { purpose: "icon", pattern: /\bicon\b/i },
  { purpose: "photo", pattern: /\b(photo|picture|product image|thumbnail|about|menu|catalog)\b/i },
];

export const PRIVATE_PAGE_PATTERN = /^\/(admin|dashboard|account|settings)(\/|$)/;

export const PAGE_DEFAULT_SLOTS: ReadonlyArray<{
  readonly pattern: RegExp;
  readonly purpose: AssetPurpose;
  readonly componentName: string;
}> = [
  { pattern: /(^\/(\s|$))|\/home\b|home|landing|marketing/i, purpose: "hero", componentName: "Hero" },
  { pattern: /about|story|our-story/i, purpose: "photo", componentName: "AboutPhoto" },
  { pattern: /team|staff|people/i, purpose: "avatar", componentName: "TeamPhoto" },
  { pattern: /gallery|portfolio|work/i, purpose: "gallery", componentName: "Gallery" },
  { pattern: /menu|catalog|shop|product|collection/i, purpose: "photo", componentName: "CatalogPhoto" },
  { pattern: /contact|location|find-us|store/i, purpose: "photo", componentName: "LocationPhoto" },
];

export const FALLBACK_SECTION_SLOT = {
  purpose: "photo" as const,
  componentName: "SectionPhoto",
};

export const MAX_DETECTED_SLOTS = 16;

export const PURPOSE_STYLE_HINTS: Readonly<Record<AssetPurpose, string>> = {
  hero: "a wide hero banner image",
  banner: "a wide promotional banner image",
  avatar: "a square profile avatar photo",
  gallery: "a gallery showcase photo",
  logo: "a simple, clean logo mark",
  background: "a subtle background texture image",
  icon: "a minimal flat icon",
  photo: "a professional photo",
  social: "a wide photograph of the real place or work, with no words or logos",
  other: "a supporting image",
};

export const REQUIRED_PURPOSES: ReadonlySet<AssetPurpose> = new Set(["hero", "logo"]);

export const SITE_WIDE_PURPOSES: ReadonlySet<AssetPurpose> = new Set(["logo", "icon"]);

export const ASPECT_RATIO_BY_PURPOSE: Readonly<Record<AssetPurpose, string>> = {
  hero: "16:9",
  banner: "3:1",
  avatar: "1:1",
  gallery: "4:3",
  logo: "1:1",
  background: "16:9",
  icon: "1:1",
  photo: "4:3",
  social: "1.91:1",
  other: "1:1",
};

export const SOCIAL_SLOT_ROUTE = "/";
export const SOCIAL_SLOT_COMPONENT = "OpenGraphImage";
