import { AssetPurpose, type AssetSlot, type Blueprint, type Page, type Theme } from "@repo/contracts";
import { buildAltText, buildSuggestedPrompt } from "./build-suggested-prompt";
import {
  ASPECT_RATIO_BY_PURPOSE,
  FALLBACK_SECTION_SLOT,
  MAX_DETECTED_SLOTS,
  PAGE_DEFAULT_SLOTS,
  PRIVATE_PAGE_PATTERN,
  PURPOSE_KEYWORDS,
  REQUIRED_PURPOSES,
  SITE_WIDE_PURPOSES,
  SOCIAL_SLOT_COMPONENT,
  SOCIAL_SLOT_ROUTE,
} from "./constants";

function humanize(text: string): string {
  return text.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function buildSlot(options: {
  page: Page;
  theme: Theme;
  purpose: AssetPurpose;
  componentName: string;
  index: number;
  domain: string;
}): AssetSlot {
  const { page, theme, purpose, componentName, index, domain } = options;
  return {
    id: `${page.route}:${componentName}:${index}`,
    pageRoute: page.route,
    componentName,
    purpose,
    altText: buildAltText(purpose, page.purpose, page.route),
    suggestedPrompt: buildSuggestedPrompt(purpose, page, theme, componentName, domain),
    status: "PENDING",
    assetId: null,
    required: REQUIRED_PURPOSES.has(purpose),
    aspectRatio: ASPECT_RATIO_BY_PURPOSE[purpose],
  };
}

function defaultSection(page: Page): { purpose: AssetPurpose; componentName: string } | null {
  if (PRIVATE_PAGE_PATTERN.test(page.route)) return null;
  const text = `${page.route} ${page.purpose}`;
  const match = PAGE_DEFAULT_SLOTS.find(
    (entry) => entry.pattern.test(page.route) || entry.pattern.test(text),
  );
  return match ?? FALLBACK_SECTION_SLOT;
}

function pushSlot(
  slots: AssetSlot[],
  seenPurposes: Set<AssetPurpose>,
  claimedSiteWide: Set<AssetPurpose>,
  slot: AssetSlot,
): void {
  if (seenPurposes.has(slot.purpose)) return;
  if (SITE_WIDE_PURPOSES.has(slot.purpose)) {
    if (claimedSiteWide.has(slot.purpose)) return;
    claimedSiteWide.add(slot.purpose);
  }
  seenPurposes.add(slot.purpose);
  slots.push(slot);
}

function slotsFromSections(
  page: Page,
  theme: Theme,
  claimedSiteWide: Set<AssetPurpose>,
  domain: string,
): AssetSlot[] {
  const slots: AssetSlot[] = [];
  const seen = new Set<string>();
  let index = 0;
  for (const section of page.sections ?? []) {
    for (const raw of section.assetPurposes) {
      const parsed = AssetPurpose.safeParse(raw);
      if (!parsed.success || seen.has(`${section.sectionId}:${parsed.data}`)) continue;
      seen.add(`${section.sectionId}:${parsed.data}`);
      const built = buildSlot({
        page,
        theme,
        purpose: parsed.data,
        componentName: section.sectionId,
        index,
        domain,
      });
      index += 1;
      const slot = section.imageAspect ? { ...built, aspectRatio: section.imageAspect } : built;
      if (SITE_WIDE_PURPOSES.has(parsed.data)) {
        pushSlot(slots, new Set(slots.map((item) => item.purpose)), claimedSiteWide, slot);
      } else {
        slots.push(slot);
      }
    }
  }
  return slots;
}

function pushPurposeMatches(input: {
  slots: AssetSlot[];
  seenPurposes: Set<AssetPurpose>;
  page: Page;
  theme: Theme;
  claimedSiteWide: Set<AssetPurpose>;
  domain: string;
  candidates: readonly { componentName: string; text: string }[];
}): void {
  input.candidates.forEach((candidate, index) => {
    const match = PURPOSE_KEYWORDS.find(({ pattern }) => pattern.test(candidate.text));
    if (!match) return;
    pushSlot(
      input.slots,
      input.seenPurposes,
      input.claimedSiteWide,
      buildSlot({
        page: input.page,
        theme: input.theme,
        purpose: match.purpose,
        componentName: candidate.componentName,
        index,
        domain: input.domain,
      }),
    );
  });
}

function slotsFromKeywords(
  page: Page,
  theme: Theme,
  claimedSiteWide: Set<AssetPurpose>,
  domain: string,
): AssetSlot[] {
  const candidates = [
    ...page.components.map((componentName) => ({ componentName, text: humanize(componentName) })),
    { componentName: "page", text: page.purpose },
  ];
  const seenPurposes = new Set<AssetPurpose>();
  const slots: AssetSlot[] = [];
  pushPurposeMatches({ slots, seenPurposes, page, theme, claimedSiteWide, domain, candidates });
  const section = defaultSection(page);
  if (section) {
    pushSlot(
      slots,
      seenPurposes,
      claimedSiteWide,
      buildSlot({
        page,
        theme,
        purpose: section.purpose,
        componentName: section.componentName,
        index: candidates.length,
        domain,
      }),
    );
  }

  return slots;
}

function detectSlotsForPage(
  page: Page,
  theme: Theme,
  claimedSiteWide: Set<AssetPurpose>,
  domain: string,
): AssetSlot[] {
  if ((page.sections ?? []).length > 0) return slotsFromSections(page, theme, claimedSiteWide, domain);
  return slotsFromKeywords(page, theme, claimedSiteWide, domain);
}

function isSeoRequired(blueprint: Blueprint): boolean {
  return (blueprint.requirements ?? []).some(
    (requirement) => requirement.area === "seo" && requirement.level === "required",
  );
}

function socialPreviewSlot(blueprint: Blueprint, domain: string): AssetSlot | undefined {
  const homePage = blueprint.pages.find((page) => page.route === SOCIAL_SLOT_ROUTE) ?? blueprint.pages[0];
  if (!homePage) return undefined;
  return {
    ...buildSlot({
      page: homePage,
      theme: blueprint.theme,
      purpose: "social",
      componentName: SOCIAL_SLOT_COMPONENT,
      index: homePage.components.length + 1,
      domain,
    }),
    required: false,
  };
}

function publicHomePage(blueprint: Blueprint): Page | undefined {
  return blueprint.pages.find((page) => !PRIVATE_PAGE_PATTERN.test(page.route));
}

function withSiteLogo(
  slots: AssetSlot[],
  blueprint: Blueprint,
  claimedSiteWide: Set<AssetPurpose>,
  domain: string,
): AssetSlot[] {
  const home = publicHomePage(blueprint);
  if (!home) return slots;
  const next = [...slots];
  pushSlot(
    next,
    new Set(next.map((slot) => slot.purpose)),
    claimedSiteWide,
    buildSlot({
      page: home,
      theme: blueprint.theme,
      purpose: "logo",
      componentName: "Logo",
      index: 0,
      domain,
    }),
  );
  return next;
}

export function detectAssetSlots(blueprint: Blueprint): readonly AssetSlot[] {
  const domain = blueprint.intent.domain;
  const claimedSiteWide = new Set<AssetPurpose>();
  const slots = withSiteLogo(
    blueprint.pages.flatMap((page) =>
      detectSlotsForPage(page, blueprint.theme, claimedSiteWide, domain),
    ),
    blueprint,
    claimedSiteWide,
    domain,
  );
  const social = isSeoRequired(blueprint) ? socialPreviewSlot(blueprint, domain) : undefined;
  const withSocial = social && slots.length > 0 ? [...slots, social] : slots;
  return withSocial.slice(0, MAX_DETECTED_SLOTS);
}
