import type { PlanSectionSummary } from "./plan-summary";

export type WireKind = "header" | "hero" | "gallery" | "cards" | "contact" | "map" | "footer" | "about" | "text";

export interface WireBlock {
  label: string;
  kind: WireKind;
  hasImage: boolean;
}

const KIND_PATTERNS: readonly { kind: WireKind; pattern: RegExp }[] = [
  { kind: "header", pattern: /menu bar|header|navigation|navbar/i },
  { kind: "footer", pattern: /footer/i },
  { kind: "hero", pattern: /banner|hero/i },
  { kind: "gallery", pattern: /gallery|portfolio|carousel|projects?/i },
  { kind: "cards", pattern: /services?|features?|pricing|team|testimonials?|reviews?/i },
  { kind: "contact", pattern: /contact|form|call to action|enquiry|booking/i },
  { kind: "map", pattern: /location|map|address/i },
  { kind: "about", pattern: /about|introduction|intro|story/i },
];

const KIND_ORDER: Readonly<Record<WireKind, number>> = {
  header: 0,
  hero: 1,
  about: 2,
  gallery: 2,
  cards: 2,
  text: 2,
  map: 3,
  contact: 4,
  footer: 5,
};

const PHOTO_SUFFIX = /\s+(photo|image|picture)$/i;
const HIDDEN_LABEL = /^logo$/i;

export function kindOf(label: string): WireKind {
  return KIND_PATTERNS.find((entry) => entry.pattern.test(label))?.kind ?? "text";
}

export function layoutBlocks(sections: readonly PlanSectionSummary[]): WireBlock[] {
  const merged = new Map<string, WireBlock>();
  for (const section of sections) {
    if (HIDDEN_LABEL.test(section.label)) continue;
    const base = section.label.replace(PHOTO_SUFFIX, "");
    const key = base.toLowerCase();
    const existing = merged.get(key);
    merged.set(key, {
      label: existing?.label ?? base,
      kind: existing?.kind ?? kindOf(base),
      hasImage: Boolean(existing?.hasImage || section.hasImage),
    });
  }
  return [...merged.values()]
    .map((block, index) => ({ block, index }))
    .sort((a, b) => KIND_ORDER[a.block.kind] - KIND_ORDER[b.block.kind] || a.index - b.index)
    .map(({ block }) => block);
}
