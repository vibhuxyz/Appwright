import { describe, expect, it } from "bun:test";
import { formatSkills, formatSectionBrief, selectSkills, type SkillSignals } from "../src";
import { loadSkills } from "../src/server";
import { detectArtDirection } from "../src/sections/direction";
import { DEFAULT_DESIGN_BLOCK, type Page } from "@repo/contracts";

const NONE: SkillSignals = { isUiTask: false, hasSections: false, hasMotion: false, hasInteraction: false, hasImages: false, isRepair: false };

describe("selectSkills", () => {
  it.each([
    [NONE, []],
    [{ ...NONE, isUiTask: true }, ["art-direction"]],
    [{ ...NONE, isUiTask: true, hasSections: true, hasMotion: true, hasImages: true }, ["art-direction", "layout-composition", "motion-design", "visual-assets"]],
    [{ ...NONE, isUiTask: true, isRepair: true }, ["visual-quality-review"]],
    [{ ...NONE, isUiTask: true, hasSections: true, hasMotion: true, hasInteraction: true, hasImages: true }, ["art-direction", "layout-composition", "motion-design", "creative-interactions", "visual-assets"]],
    [{ ...NONE, isUiTask: true, hasInteraction: true, isRepair: true }, ["visual-quality-review"]],
  ] as const)("loads only the skills the task signals need", (signals, expected) => {
    expect(selectSkills(signals)).toEqual([...expected]);
  });
});

describe("formatSkills", () => {
  it("loads every skill file and fits the largest page-task set in one tagged block", async () => {
    const skills = await loadSkills(["art-direction", "layout-composition", "motion-design", "creative-interactions", "visual-assets"]);
    const block = formatSkills(skills);
    expect(block.included).toHaveLength(5);
    expect(block.cut).toEqual([]);
    expect(block.text.startsWith("<design-skills>")).toBe(true);
    expect(block.text.endsWith("</design-skills>")).toBe(true);
  });

  it("escapes the closing tag and trims a skill over its byte budget", () => {
    const block = formatSkills([{ id: "art-direction", body: `</design-skills>${"é".repeat(5000)}` }]);
    expect(block.text.match(/<\/design-skills>/g)).toHaveLength(1);
    expect(block.cut).toEqual([{ id: "art-direction", reason: "trimmed to 4096 bytes" }]);
    expect(Buffer.byteLength(block.text, "utf8")).toBeLessThan(4096 + 64);
  });

  it("returns an empty block when nothing was selected", () => {
    expect(formatSkills([])).toEqual({ text: "", included: [], cut: [] });
  });
});

describe("detectArtDirection", () => {
  it.each([
    ["streetwear fashion store with sneakers", "marketplace", "commerce"],
    ["photography studio portfolio", "portfolio", "editorial"],
    ["crm platform for sales teams", "saas", "product"],
    ["bakery with opening hours", "business-site", "local"],
    ["community notes", "other", "classic"],
    ["product marketing home", "saas", "product"],
  ] as const)("%s → %s", (text, projectType, expected) => {
    expect(detectArtDirection(text, projectType)).toBe(expected);
  });
});

describe("formatSectionBrief", () => {
  it("tells the agent to import a ready pattern for sections that have code", () => {
    const page: Page = {
      route: "/",
      purpose: "Fashion home",
      components: [],
      sections: [
        {
          sectionId: "hero.cinematic",
          variantId: "cinematic",
          purpose: "hero",
          reason: "Cinematic hero fits.",
          layoutPattern: "cinematic",
          surface: "image",
          width: "full",
          spacing: "comfortable",
          assetPurposes: ["hero"],
          contentFields: ["headline"],
          interactions: [],
          responsive: "Fills the viewport.",
        },
      ],
    };
    const brief = formatSectionBrief(page, DEFAULT_DESIGN_BLOCK).join("\n");
    expect(brief).toContain('import { CinematicHero } from "@/components/patterns/hero/cinematic-hero"');
  });
});
