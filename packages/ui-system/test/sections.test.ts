import { describe, expect, it } from "bun:test";
import {
  FIXTURES,
  SECTION_CATALOG,
  SOURCE_DECISIONS,
  applyComposition,
  applyReview,
  compositionEvidence,
  filterSections,
  findRenderedSections,
  ingestionAllowed,
  isStackCompatible,
  measureFixtures,
  parseReviews,
  rankSections,
  scoreSection,
  sourceAllowsIngestion,
  sourceById,
} from "../src";

const MINIMAL = {
  projectType: "saas" as const,
  style: "minimal-premium",
  density: "comfortable" as const,
  allowTestimonials: false,
  previousLayout: null,
};

describe("source decisions", () => {
  it("adopts only original sections and records the other decisions", () => {
    const original = sourceById("appwright-original");
    expect(original).toBeDefined();
    if (!original) return;
    expect(sourceAllowsIngestion(original)).toBe(true);
    expect(ingestionAllowed("shadcn-ui")).toBe(false);
    expect(sourceById("origin-ui")?.decision).toBe("reject");
    expect(sourceById("motion-primitives")?.decision).toBe("reject");
    expect(sourceById("21st-dev")?.decision).toBe("reject");
    expect(sourceById("magic-ui")?.decision).toBe("defer");
    expect(sourceById("ruixen")?.decision).toBe("defer");
    expect(SOURCE_DECISIONS.every((source) => source.revision.length > 0)).toBe(true);
  });

  it("keeps Tailwind 4 and React 19 as the generated stack", () => {
    expect(isStackCompatible({ tailwindMajor: 3, reactMajor: 19 })).toBe(false);
    expect(isStackCompatible({ tailwindMajor: 4, reactMajor: 19 })).toBe(true);
  });
});

describe("ranking", () => {
  it("picks the alternating feature layout ahead of the card grid", () => {
    const ranked = rankSections(
      SECTION_CATALOG.filter((section) => section.purpose === "features"),
      MINIMAL,
    );
    const alternating = ranked.find((section) => section.id === "features.alternating");
    const cards = ranked.find((section) => section.id === "features.card-grid");
    expect(ranked[0]?.id).toBe("features.alternating");
    expect(alternating).toBeDefined();
    expect(cards).toBeDefined();
    if (!alternating || !cards) return;
    expect(scoreSection(alternating, MINIMAL)).toBeGreaterThan(scoreSection(cards, MINIMAL));
  });
});

describe("fixtures", () => {
  it("composes four project types without repeated adjacent layouts", () => {
    const results = measureFixtures();
    expect(results.map((result) => result.name)).toEqual([
      "local-business",
      "saas-marketing",
      "portfolio",
      "dashboard",
    ]);
    const local = results[0];
    const saas = results[1];
    const portfolio = results[2];
    const dashboard = results[3];
    expect(local?.pages[0]?.sectionIds).toContain("hero.split-image");
    expect(local?.pages[0]?.sectionIds).toContain("location.panel");
    expect(local?.pages[0]?.sectionIds).not.toContain("categories.scroller");
    expect(local?.pages[0]?.sectionIds).not.toContain("proof.quote-band");
    expect(saas?.pages[0]?.sectionIds).toContain("features.alternating");
    expect(saas?.pages[0]?.sectionIds).not.toContain("location.panel");
    expect(saas?.pages[1]?.sectionIds).toContain("pricing.columns");
    expect(dashboard?.pages[1]?.sectionIds).toEqual(["data.table"]);
    expect(portfolio?.pages[0]?.sectionIds).toContain("portfolio.editorial");
    expect(portfolio?.pages[0]?.sectionIds.join(" ")).not.toContain("pricing");
    expect(dashboard?.pages[0]?.sectionIds).toEqual(["dashboard.metric-strip", "data.table"]);
    expect(dashboard?.shell.navigationId).toBe("nav.sidebar");
    expect(local?.shell.navigationId).toBe("nav.top-bar");
    expect(local?.shell.footerId).toBe("footer.columns");
    for (const result of results) {
      expect(result.pages.every((page) => page.issues.length === 0)).toBe(true);
      expect(result.durationMs).toBeLessThan(50);
      const screenshots = result.evidence.find((check) => check.id === "screenshots");
      expect(screenshots?.status).toBe("not-executed");
    }
  });
});

describe("verification evidence", () => {
  it("passes section markers only when every composed id is in the HTML", () => {
    const fixture = FIXTURES[0];
    expect(fixture).toBeDefined();
    if (!fixture) return;
    const composed = applyComposition(fixture.blueprint, "business-site");
    const home = composed.pages[0];
    const ids = (home?.sections ?? []).map((section) => section.sectionId);
    expect(ids.length).toBeGreaterThan(1);
    const partial = `<section data-section="${ids[0] ?? ""}"></section>`;
    expect(findRenderedSections(partial, ids).missing.length).toBeGreaterThan(0);
    const html = ids.map((id) => `<section data-section="${id}"></section>`).join("");
    const evidence = compositionEvidence(home ? [home] : [], html);
    expect(evidence.find((item) => item.id === "section-markers")?.status).toBe("passed");
    expect(evidence.find((item) => item.id === "screenshots")?.status).toBe("not-executed");
  });
});

describe("catalog review", () => {
  it("filters by purpose text and replaces a review", () => {
    const found = filterSections(SECTION_CATALOG, {
      text: "quote",
      business: "all",
      layout: "all",
      style: "all",
      license: "commercial",
      quality: "accepted",
      review: "all",
    });
    expect(found.map((section) => section.id)).toContain("proof.quote-band");
    const reviews = applyReview([], { sectionId: "proof.quote-band", decision: "rejected", note: "needs a real quote" });
    const replaced = applyReview(reviews, { sectionId: "proof.quote-band", decision: "approved", note: "ok" });
    expect(replaced).toHaveLength(1);
    expect(replaced[0]?.decision).toBe("approved");
    expect(parseReviews([{ sectionId: "x", decision: "nope", note: "" }])).toEqual([]);
  });
});
