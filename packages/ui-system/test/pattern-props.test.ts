import { describe, expect, it } from "bun:test";
import path from "node:path";
import { FIXTURES, PATTERNS, PATTERN_PROPS, applyComposition, formatSectionBrief } from "../src";
import { extractPropsSummary } from "../src/patterns/extract-props";

const PATTERNS_DIR = path.resolve(import.meta.dir, "../patterns");

describe("pattern props summary", () => {
  it("matches every pattern's Props interface (run bun run emit:props after editing a pattern)", async () => {
    for (const pattern of PATTERNS) {
      const source = await Bun.file(path.join(PATTERNS_DIR, pattern.file)).text();
      expect({ id: pattern.id, props: PATTERN_PROPS[pattern.id] }).toEqual({ id: pattern.id, props: extractPropsSummary(source, pattern.exportName) });
    }
  });

  it("tells the model the exact prop types in the section brief", () => {
    const found = FIXTURES.find((entry) => entry.name === "portfolio");
    if (!found) throw new Error("no portfolio fixture");
    const composed = applyComposition(found.blueprint, "portfolio");
    const home = composed.pages[0];
    const brief = home ? formatSectionBrief(home, composed.design).join("\n") : "";
    expect(brief).toContain("Props {");
    expect(brief).toContain("pass exactly these types");
  });

  it("states that OverlayNav takes a brand string", () => {
    expect(PATTERN_PROPS["nav.overlay-menu"]).toContain("brand: string");
  });
});
