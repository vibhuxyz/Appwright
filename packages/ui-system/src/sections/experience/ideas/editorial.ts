import type { SignatureIdea } from "../types";

export const EDITORIAL_IDEAS: readonly SignatureIdea[] = [
  {
    id: "editorial.arrange-the-work",
    direction: "editorial",
    idea: "Visitors pick up and rearrange the work on a desk-like stage, the way a studio pins prints to a wall.",
    effectId: "draggable-cards",
    hostSectionIds: ["hero.playground"],
    signal: /\b(playful|interactive|experimental|playground|drag\w*|creative studio)\b/i,
  },
  {
    id: "editorial.living-collage",
    direction: "editorial",
    idea: "A printed-feeling collage: overlapping images with film grain that lean toward the pointer.",
    effectId: "pointer-drift",
    hostSectionIds: ["gallery.collage"],
  },
  {
    id: "editorial.drawn-line",
    direction: "editorial",
    idea: "One hand-drawn line threads the page, drawing itself under the headline and again beside the story.",
    effectId: "draw-path",
    hostSectionIds: ["hero.editorial", "statement.manifesto"],
  },
  {
    id: "editorial.layered-prints",
    direction: "editorial",
    idea: "The work drifts at different depths as the visitor scrolls, like flipping through layered prints.",
    effectId: "parallax",
    hostSectionIds: ["gallery.editorial", "portfolio.editorial"],
  },
  {
    id: "editorial.story-unfolds",
    direction: "editorial",
    idea: "The case study reads like a story told aloud: each line of the problem and the result arrives with the scroll.",
    effectId: "scroll-reveal",
    hostSectionIds: ["story.case-study", "statement.manifesto"],
  },
  {
    id: "editorial.focus-pull",
    direction: "editorial",
    idea: "The headline pulls into focus word by word, like a lens finding its subject.",
    effectId: "blur-text",
    hostSectionIds: ["hero.editorial"],
  },
];
