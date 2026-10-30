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

function homeSectionIds(purpose: string, fixtureName = "portfolio"): readonly string[] {
  const found = FIXTURES.find((entry) => entry.name === fixtureName);
  if (!found) throw new Error(`no fixture ${fixtureName}`);
  const blueprint = { ...found.blueprint, pages: found.blueprint.pages.map((page, index) => (index === 0 ? { ...page, purpose } : page)) };
  return applyComposition(blueprint, found.blueprint.projectType ?? "other").pages[0]?.sections?.map((section) => section.sectionId) ?? [];
}

const MIXED_PURPOSE = "Single-page landing for Arbor & Oak architecture studio, resort, furniture collection, and consultancy";

describe("mixed briefs", () => {
  it("merge every matching playbook, with one primary and the most permissive motion budget", () => {
    const merged = detectPlaybook(MIXED_PURPOSE);
    expect([...(merged?.ids ?? [])].sort()).toEqual(["agency", "commerce", "hospitality", "studio"]);
    expect(merged?.motion).toEqual({ isSmoothScrollOn: true, maxPinnedScenes: 1 });
    expect(merged?.sectionOrder.length).toBeLessThanOrEqual(10);
  });

  it("give each business its own section pattern, with the closing section last", () => {
    const ids = homeSectionIds(MIXED_PURPOSE);
    for (const expected of ["portfolio.index-list", "story.case-row", "commerce.mosaic"]) expect(ids).toContain(expected);
    expect(ids.indexOf("commerce.mosaic")).toBeLessThan(ids.indexOf("contact.split"));
  });
});

describe("playbook section selection", () => {
  it("gives store briefs the collection mosaic and split promo, and no other site type", () => {
    const store = homeSectionIds("Online store for sneakers with cart and checkout", "fashion-store");
    expect(store).toContain("commerce.mosaic");
    expect(store).toContain("commerce.split-promo");
    for (const [purpose, fixtureName] of [["B2B marketing agency home", "portfolio"], ["Luxury resort and villa bookings home", "local-business"], ["Neighbourhood plumber home", "local-business"]] as const) {
      const ids = homeSectionIds(purpose, fixtureName);
      expect({ purpose, mosaic: ids.includes("commerce.mosaic"), promo: ids.includes("commerce.split-promo") }).toEqual({ purpose, mosaic: false, promo: false });
    }
  });

  it("gives studio briefs one expanding statement and then no second pinned scene", () => {
    const found = FIXTURES.find((entry) => entry.name === "portfolio");
    if (!found) throw new Error("no portfolio fixture");
    const purpose = "Architecture studio home with selected projects";
    const blueprint = { ...found.blueprint, pages: found.blueprint.pages.map((page, index) => (index === 0 ? { ...page, purpose } : page)) };
    const composed = applyComposition(blueprint, "portfolio");
    const home = composed.pages[0];
    const plan = home ? planComposition(home, composed.design) : null;
    expect(plan?.sections.map((section) => section.sectionId)).toContain("story.expand-statement");
    expect(plan && planExperience(plan, { briefText: purpose, seed: "studio" }).pinnedStatement).toBeNull();
    for (const other of ["B2B marketing agency home", "Personal photography gallery home"]) expect(homeSectionIds(other)).not.toContain("story.expand-statement");
  });

  it("uses the case rows for agency briefs only", () => {
    expect(homeSectionIds("B2B marketing agency home with selected work and case studies")).toContain("story.case-row");
    expect(homeSectionIds("Architecture studio home with selected projects")).not.toContain("story.case-row");
    expect(homeSectionIds("Personal photography gallery home")).not.toContain("story.case-row");
  });

  it("gives hospitality briefs the manifesto statement and keeps it off ordinary local businesses", () => {
    expect(homeSectionIds("Luxury resort and villa bookings home", "local-business")).toContain("statement.manifesto");
    expect(homeSectionIds("Neighbourhood plumber home with opening hours", "local-business")).not.toContain("statement.manifesto");
  });

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
