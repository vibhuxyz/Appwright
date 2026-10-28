import { describe, expect, it } from "bun:test";
import type { Finding } from "@repo/browser";
import { DESIGN_CASES } from "../src/design";
import { gradeCase } from "../src/design/grade-case";
import { showcaseCss, showcasePage } from "../src/design/showcase-files";

const fashion = DESIGN_CASES.find((designCase) => designCase.id === "fashion-storefront");
const html = (ids: readonly string[]) => ids.map((id) => `<section data-section="${id}"></section>`).join("");

function finding(kind: Finding["kind"], severity: Finding["severity"], route: string): Finding {
  return { kind, severity, route, viewport: "mobile", message: kind };
}

describe("design eval cases", () => {
  it("covers the reference categories and the creative 2D cases", () => {
    expect(DESIGN_CASES.map((designCase) => designCase.id)).toEqual([
      "editorial-portfolio",
      "fashion-storefront",
      "saas-landing",
      "content-business",
      "local-business",
      "creative-studio",
      "campaign-commerce",
      "product-lab",
    ]);
  });

  it("checks scrolling and tap targets everywhere, and the signature interaction where there is one", () => {
    for (const designCase of DESIGN_CASES) expect(designCase.interactions).toEqual(expect.arrayContaining(["content-after-scroll", "mobile-tap-targets"]));
    expect(DESIGN_CASES.find((designCase) => designCase.id === "creative-studio")?.interactions).toContain("drag-card");
    expect(DESIGN_CASES.find((designCase) => designCase.id === "product-lab")?.interactions).toEqual(expect.arrayContaining(["image-compare-keyboard", "canvas-reduced-motion"]));
  });
});

describe("gradeCase", () => {
  it("fails a case whose interaction check failed", () => {
    const fashion = DESIGN_CASES[1];
    if (!fashion) throw new Error("no fashion case");
    const grade = gradeCase(fashion, html(fashion.expectedSections), [], [{ id: "content-after-scroll", passed: false, detail: "still hidden: Shop" }]);
    expect(grade.passed).toBe(false);
  });

  it("passes when every section renders and only sample links failed", () => {
    if (!fashion) throw new Error("missing case");
    const grade = gradeCase(fashion, html(fashion.expectedSections), [finding("broken-link", "error", fashion.route)]);
    expect(grade).toMatchObject({ passed: true, ignoredSampleLinks: 1, missingSections: [] });
  });

  it("fails on a missing section or a layout error on its own route only", () => {
    if (!fashion) throw new Error("missing case");
    const findings = [finding("horizontal-overflow", "error", fashion.route), finding("page-error", "error", "/other")];
    const grade = gradeCase(fashion, html(fashion.expectedSections.slice(1)), findings);
    expect(grade.passed).toBe(false);
    expect(grade.missingSections).toEqual(fashion.expectedSections.slice(0, 1));
    expect(grade.errors.map((entry) => entry.kind)).toEqual(["horizontal-overflow"]);
  });
});

describe("showcase files", () => {
  it("puts the font import first and scopes each theme to its case", () => {
    const css = showcaseCss(DESIGN_CASES, '@import "tailwindcss";');
    expect(css.startsWith('@import url("https://fonts.googleapis.com/css2?')).toBe(true);
    expect(css).toContain('[data-case="fashion-storefront"] {');
    expect(css).toContain("--primary: #d6001c;");
  });

  it("renders the example inside its theme scope", () => {
    if (!fashion) throw new Error("missing case");
    expect(showcasePage(fashion)).toContain('<div data-case="fashion-storefront">');
  });
});
