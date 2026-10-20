import type { AssetPurpose, AssetSlot, Blueprint, Page, Theme } from "@repo/contracts";
import { buildAltText, buildSuggestedPrompt } from "./build-suggested-prompt";
import { PURPOSE_KEYWORDS } from "./constants";

export function detectAssetSlots(blueprint: Blueprint): readonly AssetSlot[] {
  return blueprint.pages.flatMap((page) => detectSlotsForPage(page, blueprint.theme));
}

// "AvatarGrid" has no word boundary between "Avatar" and "Grid", so a plain
// \bavatar\b test misses it. Splitting camelCase/PascalCase into words
// before matching lets the same keyword patterns cover both component
// names and free-text page purposes.
function humanize(text: string): string {
  return text.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function detectSlotsForPage(page: Page, theme: Theme): AssetSlot[] {
  const candidates = [
    ...page.components.map((componentName) => ({ componentName, text: humanize(componentName) })),
    { componentName: "page", text: page.purpose },
  ];

  const seenPurposes = new Set<AssetPurpose>();
  const slots: AssetSlot[] = [];

  candidates.forEach((candidate, index) => {
    const match = PURPOSE_KEYWORDS.find(({ pattern }) => pattern.test(candidate.text));
    if (!match || seenPurposes.has(match.purpose)) return;
    seenPurposes.add(match.purpose);
    slots.push({
      id: `${page.route}:${candidate.componentName}:${index}`,
      pageRoute: page.route,
      componentName: candidate.componentName,
      purpose: match.purpose,
      altText: buildAltText(match.purpose, page.purpose),
      suggestedPrompt: buildSuggestedPrompt(match.purpose, page, theme),
      status: "PENDING",
      assetId: null,
    });
  });

  return slots;
}
