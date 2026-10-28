import type { SignatureIdea } from "../types";

export const CLASSIC_IDEAS: readonly SignatureIdea[] = [
  {
    id: "classic.marked-promise",
    direction: "classic",
    idea: "The one promise that matters is marked in the headline, as if someone underlined it by hand.",
    effectId: "highlight-text",
    hostSectionIds: ["hero.centered", "hero.split-image", "cta.band"],
  },
  {
    id: "classic.counted-proof",
    direction: "classic",
    idea: "The firm's record counts up as the visitor reaches it: years, clients, cases.",
    effectId: "count-up",
    hostSectionIds: ["stats.band"],
  },
  {
    id: "classic.soft-light",
    direction: "classic",
    idea: "A slow, soft light moves behind the opening line, calm enough to read as confidence.",
    effectId: "ambient-gradient",
    hostSectionIds: ["hero.centered", "cta.band"],
  },
  {
    id: "classic.drawn-signature",
    direction: "classic",
    idea: "A single drawn stroke underlines the brand's promise like a signature at the end of a letter.",
    effectId: "draw-path",
    hostSectionIds: ["hero.split-image", "brand.intro"],
  },
];
