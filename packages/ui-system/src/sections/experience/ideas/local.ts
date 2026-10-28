import type { SignatureIdea } from "../types";

export const LOCAL_IDEAS: readonly SignatureIdea[] = [
  {
    id: "local.before-after",
    direction: "local",
    idea: "Visitors drag across the work to see the before and after themselves.",
    effectId: "image-compare",
    hostSectionIds: ["gallery.row", "brand.intro"],
    signal: /\b(before|after|renovat\w*|restor\w*|makeover|transform\w*|repair\w*)\b/i,
  },
  {
    id: "local.hand-drawn",
    direction: "local",
    idea: "A hand-drawn underline and doodle give the page the warmth of a chalkboard menu or a handwritten sign.",
    effectId: "draw-path",
    hostSectionIds: ["hero.split-image", "hero.centered", "brand.intro"],
  },
  {
    id: "local.counted-years",
    direction: "local",
    idea: "Years open, jobs finished and regulars served count up as the visitor reaches them, the neighbourhood's track record in numbers.",
    effectId: "count-up",
    hostSectionIds: ["stats.band"],
  },
  {
    id: "local.warm-light",
    direction: "local",
    idea: "A slow, warm light moves behind the welcome, like late sun through the shop window.",
    effectId: "ambient-gradient",
    hostSectionIds: ["hero.centered", "cta.band"],
  },
  {
    id: "local.layered-gallery",
    direction: "local",
    idea: "Photos of the place drift at different depths as the visitor scrolls, as if walking past the window.",
    effectId: "parallax",
    hostSectionIds: ["gallery.row"],
  },
];
