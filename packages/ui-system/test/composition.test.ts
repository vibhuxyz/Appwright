import { describe, expect, it } from "bun:test";
import { FIXTURES, PATTERNS, applyComposition, critique, detectPagePlaybook, planComposition, planPatternDelivery } from "../src";
import { SHARED_PATTERN_FILES } from "../src/patterns";
import { EFFECTS } from "../src";

function composedHome(name: string) {
  const fixture = FIXTURES.find((entry) => entry.name === name);
  if (!fixture) throw new Error(`no fixture ${name}`);
  const blueprint = applyComposition(fixture.blueprint, fixture.blueprint.projectType ?? "other");
  const home = blueprint.pages.find((page) => page.route === "/");
  if (!home) throw new Error(`no home page in ${name}`);
  return { home, design: blueprint.design };
}

describe("planComposition", () => {
  it("plans the sneaker store as anchor, discovery, a spacious story, then conversion", () => {
    const { home, design } = composedHome("fashion-store");
    const plan = planComposition(home, design);
    expect(plan?.artDirection).toBe("commerce");
    expect(plan?.visualStrategy.imageTreatment).toBe("product");
    const roles = plan?.sections.map((section) => section.visualRole) ?? [];
    expect(roles[0]).toBe("anchor");
    expect(roles.filter((role) => role === "anchor")).toHaveLength(1);
    expect(roles.at(-1)).toBe("conversion");
    expect(plan?.sections.some((section) => section.density === "high")).toBe(true);
    expect(plan?.constraints.some((constraint) => constraint.startsWith("hero.cinematic is the one focal point"))).toBe(true);
  });

  it("gives every fixture page a plan that the critique accepts", () => {
    for (const fixture of FIXTURES) {
      const blueprint = applyComposition(fixture.blueprint, fixture.blueprint.projectType ?? "other");
      for (const page of blueprint.pages) {
        expect({ page: page.route, issues: critique(page.sections ?? [], detectPagePlaybook(page)) }).toEqual({ page: page.route, issues: [] });
        expect(planComposition(page, blueprint.design)).not.toBeNull();
      }
    }
  });

  it("never selects the same section twice and plans every selected section", () => {
    for (const fixture of FIXTURES) {
      const { pages, design } = applyComposition(fixture.blueprint, fixture.blueprint.projectType ?? "other");
      for (const page of pages) {
        const ids = (page.sections ?? []).map((section) => section.sectionId);
        expect(new Set(ids).size).toBe(ids.length);
        const plan = planComposition(page, design);
        expect(plan?.sections.length).toBe(ids.length);
      }
    }
  });

  it("returns null when the page has no planned sections", () => {
    const { design } = composedHome("fashion-store");
    expect(planComposition({ route: "/", purpose: "home", components: [] }, design)).toBeNull();
  });
});

describe("pattern delivery properties", () => {
  const effectFileById = new Map(EFFECTS.map((effect) => [effect.id, effect.file]));

  it("delivers every required file of each selected pattern", () => {
    for (const pattern of PATTERNS) {
      const sources = new Set(planPatternDelivery([pattern.id]).files.map((file) => file.source));
      const expected = [pattern.file, ...pattern.requires, ...pattern.effects.flatMap((id) => effectFileById.get(id) ?? []), ...SHARED_PATTERN_FILES];
      for (const file of expected) expect({ pattern: pattern.id, file, delivered: sources.has(file) }).toEqual({ pattern: pattern.id, file, delivered: true });
    }
  });

  it("delivers shared files once however many patterns use them", () => {
    const sources = planPatternDelivery(PATTERNS.map((pattern) => pattern.id)).files.map((file) => file.source);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it("does not deliver the files of patterns that were not selected", () => {
    const sources = new Set(planPatternDelivery(["promo.bar"]).files.map((file) => file.source));
    for (const pattern of PATTERNS.filter((entry) => entry.id !== "promo.bar")) expect(sources.has(pattern.file)).toBe(false);
  });

  it("explains each id that has no pattern code", () => {
    const plan = planPatternDelivery(["promo.bar", "pricing.columns", "hero.unknown"]);
    expect(plan.skipped.map((entry) => entry.id)).toEqual(["hero.unknown", "pricing.columns"]);
    expect(plan.skipped.every((entry) => entry.reason.includes(entry.id))).toBe(true);
  });
});
