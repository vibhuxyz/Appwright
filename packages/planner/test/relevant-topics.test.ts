import { describe, expect, it } from "bun:test";
import { extractFacts, materialTopics } from "../src/discovery";

function topicIds(prompt: string, answers: Record<string, string> = {}): string[] {
  return materialTopics(extractFacts(prompt, { "ordering-mode": "Browse only", ...answers })).map((item) => item.id);
}

const ARBOR =
  "Build a single-page website for Arbor & Oak, a design-led group in Lisbon: an architecture studio, a boutique resort with booking enquiries, an online furniture and lighting collection with a shop-by-collection area, and a B2B marketing consultancy. Contact: hello@example.com.";

describe("topics that only apply to some briefs", () => {
  it("does not ask a single-page, non-food, non-storefront brief about pages, menus or shop hours", () => {
    const ids = topicIds(ARBOR);
    for (const skipped of ["site-pages", "menu-structure", "opening-hours"]) expect(ids).not.toContain(skipped);
  });

  it("still asks them for a bakery that has a menu and opening hours", () => {
    const ids = topicIds("Build a website for Harbor & Rye, a neighbourhood bakery and cafe in Portland serving sourdough, with the menu and opening hours.");
    for (const kept of ["site-pages", "menu-structure", "opening-hours"]) expect(ids).toContain(kept);
  });

  it("drops only the pages question for a single-page bakery site", () => {
    const ids = topicIds("Build a single-page website for a bakery with a menu and opening hours.");
    expect(ids).not.toContain("site-pages");
    expect(ids).toContain("menu-structure");
    expect(ids).toContain("opening-hours");
  });
});
