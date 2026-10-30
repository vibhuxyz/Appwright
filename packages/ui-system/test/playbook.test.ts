import { describe, expect, it } from "bun:test";
import { FIXTURES, PLAYBOOKS, PLAYBOOK_IDS, applyComposition, detectPlaybook, formatComposition, planComposition, planExperience, sectionById } from "../src";

const BRIEFS: ReadonlyArray<readonly [string, string | null]> = [
  ["Online store for sneakers with cart and checkout", "commerce"],
  ["Luxury resort and villa bookings with suites", "hospitality"],
  ["Residential apartments development in the city centre", "hospitality"],
  ["Architect and building design practice for family homes", "studio"],
  ["B2B marketing agency for tourism brands", "agency"],
  ["Developer API and analytics dashboard for startups", null],
  ["", null],
];

describe("detectPlaybook", () => {
  for (const [brief, expected] of BRIEFS) {
    it(`maps "${brief}" to ${expected ?? "no playbook"}`, () => {
      expect(detectPlaybook(brief)?.id ?? null).toBe(expected);
    });
  }
});

function homeSectionIds(purpose: string): readonly string[] {
  const found = FIXTURES.find((entry) => entry.name === "portfolio");
  if (!found) throw new Error("no portfolio fixture");
  const blueprint = { ...found.blueprint, pages: found.blueprint.pages.map((page, index) => (index === 0 ? { ...page, purpose } : page)) };
  return applyComposition(blueprint, "portfolio").pages[0]?.sections?.map((section) => section.sectionId) ?? [];
}

describe("playbook section selection", () => {
  it("uses the index list for studio and agency briefs only", () => {
    expect(homeSectionIds("Architecture studio home with selected projects")).toContain("portfolio.index-list");
    expect(homeSectionIds("B2B marketing agency home with selected work")).toContain("portfolio.index-list");
    const personal = homeSectionIds("Personal photography gallery home");
    expect(personal).toContain("portfolio.editorial");
    expect(personal).not.toContain("portfolio.index-list");
  });
});

describe("playbooks", () => {
  it("only reference sections that exist in the catalog", () => {
    for (const id of PLAYBOOK_IDS) {
      const playbook = PLAYBOOKS[id];
      for (const sectionId of [...playbook.heroSectionIds, ...playbook.sectionOrder]) {
        expect({ playbook: id, sectionId, known: sectionById(sectionId) !== undefined }).toEqual({ playbook: id, sectionId, known: true });
      }
    }
  });

  it("gives commerce no smooth scroll and no pinned scene, and the others at most one", () => {
    expect(PLAYBOOKS.commerce.motion).toEqual({ isSmoothScrollOn: false, maxPinnedScenes: 0 });
    for (const id of PLAYBOOK_IDS.filter((entry) => entry !== "commerce")) expect(PLAYBOOKS[id].motion.maxPinnedScenes).toBe(1);
  });

  it("applies the motion budget in the experience plan and shows the playbook in the brief", () => {
    for (const entry of FIXTURES) {
      const composed = applyComposition(entry.blueprint, entry.blueprint.projectType ?? "other");
      const home = composed.pages[0];
      const plan = home ? planComposition(home, composed.design) : null;
      if (!home || !plan?.playbook) continue;
      const strategy = planExperience(plan, { briefText: home.purpose, seed: entry.name });
      if (plan.playbook.id === "commerce") {
        expect(strategy.foundationEffectIds).toEqual([]);
        expect(strategy.pinnedStatement).toBeNull();
      }
      expect(formatComposition(plan).join("\n")).toContain(`Site-type playbook ${plan.playbook.id}`);
    }
  });
});
