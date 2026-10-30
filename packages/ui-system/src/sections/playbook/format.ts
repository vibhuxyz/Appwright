import type { Playbook } from "./types";

export function formatPlaybook(playbook: Playbook): string[] {
  const { motion, typography } = playbook;
  return [
    `Site-type playbook ${playbook.ids.join(" + ")} (like ${playbook.examples}; follow it over generic habits${playbook.ids.length > 1 ? "; this page mixes site types, so give each business its own section pattern" : ""}):`,
    `- Hero: ${playbook.hero}`,
    `- Preferred section order when the page has them: ${playbook.sectionOrder.join(", ")}.`,
    ...playbook.imageRules.map((rule) => `- Images: ${rule}`),
    `- Type: display headlines at least ${typography.displayMinPx}px on desktop with ${typography.trackingEm}em tracking.`,
    `- Colour: ${playbook.backgrounds}`,
    `- Motion budget: ${motion.isSmoothScrollOn ? "smooth scroll on" : "native scroll"}, at most ${motion.maxPinnedScenes} pinned scene${motion.maxPinnedScenes === 1 ? "" : "s"}.`,
  ];
}
