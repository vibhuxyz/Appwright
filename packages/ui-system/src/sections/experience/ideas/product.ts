import type { SignatureIdea } from "../types";

export const PRODUCT_IDEAS: readonly SignatureIdea[] = [
  {
    id: "product.live-surface",
    direction: "product",
    idea: "The hero surface is alive: a quiet particle field parts around the pointer, showing the product responds.",
    effectId: "particle-field",
    hostSectionIds: ["hero.spotlight", "hero.centered"],
  },
  {
    id: "product.glowing-features",
    direction: "product",
    idea: "Feature tiles light up under the pointer so exploring the features feels like using the product.",
    effectId: "hover-glow",
    hostSectionIds: ["features.bento"],
  },
  {
    id: "product.spotlight-sweep",
    direction: "product",
    idea: "A soft light sweeps across the hero once and settles on the product name.",
    effectId: "spotlight",
    hostSectionIds: ["hero.spotlight"],
  },
  {
    id: "product.rotating-jobs",
    direction: "product",
    idea: "The headline cycles through the jobs the product does, one word at a time, so one line shows its range.",
    effectId: "rotating-text",
    hostSectionIds: ["hero.centered", "hero.spotlight"],
  },
  {
    id: "product.proof-counts",
    direction: "product",
    idea: "The proof numbers count up as they come into view, so the results feel measured, not claimed.",
    effectId: "count-up",
    hostSectionIds: ["stats.band"],
  },
  {
    id: "product.stage-tilt",
    direction: "product",
    idea: "The product screens tilt toward the pointer like a device turned in the hand.",
    effectId: "tilt-card",
    hostSectionIds: ["showcase.stage", "features.card-grid"],
  },
];
