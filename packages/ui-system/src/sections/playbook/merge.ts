import type { Playbook } from "./types";

const MAX_MERGED_ORDER = 10;
const MAX_MERGED_IMAGE_RULES = 6;

function interleave(lists: readonly (readonly string[])[]): string[] {
  const longest = Math.max(...lists.map((list) => list.length));
  const merged: string[] = [];
  for (let index = 0; index < longest; index += 1) {
    for (const list of lists) {
      const item = list[index];
      if (item !== undefined && !merged.includes(item)) merged.push(item);
    }
  }
  return merged.slice(0, MAX_MERGED_ORDER);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export function mergePlaybooks(playbooks: readonly [Playbook, ...Playbook[]]): Playbook {
  const [primary, ...rest] = playbooks;
  if (rest.length === 0) return primary;
  return {
    id: primary.id,
    ids: playbooks.map((playbook) => playbook.id),
    examples: playbooks.map((playbook) => playbook.examples).join("; "),
    hero: primary.hero,
    heroSectionIds: unique(playbooks.flatMap((playbook) => playbook.heroSectionIds)),
    sectionOrder: interleave(playbooks.map((playbook) => playbook.sectionOrder)),
    imageRules: unique(playbooks.flatMap((playbook) => playbook.imageRules)).slice(0, MAX_MERGED_IMAGE_RULES),
    motion: {
      isSmoothScrollOn: playbooks.some((playbook) => playbook.motion.isSmoothScrollOn),
      maxPinnedScenes: Math.max(...playbooks.map((playbook) => playbook.motion.maxPinnedScenes)),
    },
    typography: {
      displayMinPx: Math.max(...playbooks.map((playbook) => playbook.typography.displayMinPx)),
      trackingEm: Math.min(...playbooks.map((playbook) => playbook.typography.trackingEm)),
    },
    backgrounds: unique(playbooks.map((playbook) => playbook.backgrounds)).join(" "),
  };
}
