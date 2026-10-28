import type { SignatureIdea } from "../types";

export const COMMERCE_IDEAS: readonly SignatureIdea[] = [
  {
    id: "commerce.campaign-opens",
    direction: "commerce",
    idea: "The campaign story opens up: its framed image grows from a card to full screen as the visitor scrolls, then the copy lands on it.",
    effectId: "scroll-expand",
    hostSectionIds: ["story.split-image", "story.sticky-scroll", "commerce.campaign-banner"],
  },
  {
    id: "commerce.hero-fold",
    direction: "commerce",
    idea: "The campaign hero folds into an angled frame as the visitor scrolls into the products.",
    effectId: "scroll-shape",
    hostSectionIds: ["hero.cinematic"],
  },
  {
    id: "commerce.collection-tilt",
    direction: "commerce",
    idea: "Featured collection cards tilt toward the pointer, like products picked up off a shelf.",
    effectId: "tilt-card",
    hostSectionIds: ["commerce.featured-collection"],
  },
  {
    id: "commerce.marquee-speed",
    direction: "commerce",
    idea: "The brand line runs across the page and speeds up with the visitor's scroll, like a street banner in the wind.",
    effectId: "scroll-velocity",
    hostSectionIds: ["band.marquee"],
  },
  {
    id: "commerce.layered-lookbook",
    direction: "commerce",
    idea: "Lookbook images drift at different depths as the visitor scrolls, so the collection feels styled, not listed.",
    effectId: "parallax",
    hostSectionIds: ["gallery.editorial", "gallery.row"],
  },
];
