import { describe, expect, it } from "bun:test";
import type { Blueprint } from "@repo/contracts";
import { EFFECTS, FIXTURES, applyComposition, experienceEffectIds, experienceSeed, formatExperience, planComposition, planExperience, sectionById, SIGNATURE_IDEAS } from "../src";

const VARIETY_SEEDS = 40;
const IMAGE_EFFECT_IDS = new Set(["image-compare", "parallax", "pointer-drift", "scroll-expand", "scroll-shape"]);

function fixture(name: string): Blueprint {
  const found = FIXTURES.find((entry) => entry.name === name);
  if (!found) throw new Error(`no fixture ${name}`);
  return found.blueprint;
}

function homeExperience(blueprint: Blueprint) {
  const composed = applyComposition(blueprint, blueprint.projectType ?? "other");
  const home = composed.pages[0];
  if (!home) throw new Error("no home page");
  const plan = planComposition(home, composed.design);
  if (!plan) throw new Error("no composition plan");
  return { plan, strategy: planExperience(plan, { briefText: home.purpose, seed: experienceSeed({ page: home, design: composed.design }) }), home };
}

function withHomePurpose(blueprint: Blueprint, purpose: string): Blueprint {
  return { ...blueprint, pages: blueprint.pages.map((page, index) => (index === 0 ? { ...page, purpose } : page)) };
}

describe("planExperience", () => {
  it("gives the sneaker store one commerce moment and keeps product discovery still", () => {
    const { strategy } = homeExperience(fixture("fashion-store"));
    const commerceEffects = new Set(SIGNATURE_IDEAS.filter((idea) => idea.direction === "commerce").map((idea) => idea.effectId));
    expect(commerceEffects.has(strategy.signature?.effectId ?? "")).toBe(true);
    expect(strategy.sectionMotion.find((entry) => entry.sectionId === "commerce.product-rail")?.level).toBe("none");
    expect(strategy.imageTreatments.find((treatment) => treatment.role === "product")).toEqual({ role: "product", entrance: "none", hover: "zoom", scroll: "static" });
  });

  it("lets a playful studio brief pick the drag stage hero, and a plain portfolio stay editorial", () => {
    const playful = homeExperience(withHomePurpose(fixture("portfolio"), "Playful interactive studio home with our work"));
    expect(playful.home.sections?.[0]?.sectionId).toBe("hero.playground");
    expect(playful.strategy.signature?.effectId).toBe("draggable-cards");
    const plain = homeExperience(fixture("portfolio"));
    expect(plain.home.sections?.[0]?.sectionId).toBe("hero.editorial");
    expect(plain.strategy.signature?.effectId).not.toBe("draggable-cards");
  });

  it("offers before and after only when the brief mentions it", () => {
    const renovation = homeExperience(withHomePurpose(fixture("local-business"), "Kitchen renovation company home with before and after photos"));
    expect(renovation.strategy.signature?.effectId).toBe("image-compare");
    expect(homeExperience(fixture("local-business")).strategy.signature?.effectId).not.toBe("image-compare");
  });

  it("adds nothing to a dashboard and nothing beyond foundation, signature, pinned statement and two supporting effects anywhere", () => {
    const dashboard = applyComposition(fixture("dashboard"), "saas");
    const page = dashboard.pages[0];
    const plan = page ? planComposition(page, dashboard.design) : null;
    expect(plan && formatExperience(planExperience(plan, { briefText: page?.purpose ?? "", seed: "dashboard" }))).toEqual([]);
    for (const entry of FIXTURES) {
      const { strategy } = homeExperience(entry.blueprint);
      expect(experienceEffectIds(strategy).length).toBeLessThanOrEqual(5);
    }
  });

  it("mounts smooth scroll on animated pages and pins one statement when a host section exists", () => {
    for (const entry of FIXTURES) {
      const { plan, strategy } = homeExperience(entry.blueprint);
      const isAnimated = strategy.sectionMotion.some((section) => section.level !== "none");
      expect(strategy.foundationEffectIds).toEqual(isAnimated ? ["smooth-scroll"] : []);
      if (!strategy.pinnedStatement) continue;
      expect(plan.sections.map((section) => section.sectionId)).toContain(strategy.pinnedStatement.sectionId);
      expect(strategy.sectionMotion.find((section) => section.sectionId === strategy.pinnedStatement?.sectionId)?.level).toBe("choreography");
    }
  });

  it("names only registered effects in every signature idea", () => {
    const ids = new Set(EFFECTS.map((effect) => effect.id));
    for (const idea of SIGNATURE_IDEAS) expect({ idea: idea.id, known: ids.has(idea.effectId) }).toEqual({ idea: idea.id, known: true });
  });

  it("only pairs an idea with an effect made for its art direction, with ids unique", () => {
    expect(new Set(SIGNATURE_IDEAS.map((idea) => idea.id)).size).toBe(SIGNATURE_IDEAS.length);
    const directionsById = new Map(EFFECTS.map((effect) => [effect.id, effect.directions]));
    for (const idea of SIGNATURE_IDEAS) {
      expect({ idea: idea.id, fits: directionsById.get(idea.effectId)?.includes(idea.direction) }).toEqual({ idea: idea.id, fits: true });
    }
  });

  it("hosts every idea only in sections that exist, and image effects only in sections with images", () => {
    for (const idea of SIGNATURE_IDEAS) {
      for (const sectionId of idea.hostSectionIds) {
        const section = sectionById(sectionId);
        const needsImages = IMAGE_EFFECT_IDS.has(idea.effectId);
        expect({ idea: idea.id, sectionId, exists: section !== undefined, hasImages: needsImages ? (section?.assets.length ?? 0) > 0 : true })
          .toEqual({ idea: idea.id, sectionId, exists: true, hasImages: true });
      }
    }
  });

  it("picks the same signature for the same project and varies it across similar projects", () => {
    const { plan, home } = homeExperience(fixture("fashion-store"));
    const pick = (seed: string) => planExperience(plan, { briefText: home.purpose, seed }).signature?.effectId;
    expect(pick("store-a")).toBe(pick("store-a"));
    const picks = new Set(Array.from({ length: VARIETY_SEEDS }, (_, index) => pick(`store-${index}`)));
    expect(picks.size).toBeGreaterThan(1);
  });

  it("lets a brief signal win over seed variety", () => {
    const { plan, home } = homeExperience(withHomePurpose(fixture("local-business"), "Bathroom renovation with before and after photos"));
    for (let index = 0; index < VARIETY_SEEDS; index += 1) {
      expect(planExperience(plan, { briefText: home.purpose, seed: `renovator-${index}` }).signature?.effectId).toBe("image-compare");
    }
  });
});
