import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { EFFECTS, PATTERNS, SECTION_CATALOG, VENDORED_EFFECTS, patternById, planPatternDelivery } from "../src";
import { SHARED_PATTERN_FILES } from "../src/patterns";
import { PATTERNS_SOURCE_DIR } from "../src/server";
import { adaptEffectSource } from "../src/patterns";

const OWN_PATTERN_DIRS = ["hero", "commerce", "editorial", "layout", "shared"];
const HEX_COLOUR = /#[0-9a-fA-F]{3,8}\b/;
const BRACKET_VALUE = /[a-zA-Z0-9_-]+-\[[^[\]]+\]/;
const RAW_PALETTE_CLASS = /\b(?:bg|text|border|from|via|to|ring|fill|stroke|outline|shadow|decoration)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})\b/;
const ON_IMAGE_FILE = "shared/on-image.ts";

function source(file: string): string {
  return readFileSync(path.join(PATTERNS_SOURCE_DIR, file), "utf8");
}

const ownFiles = [...new Set(PATTERNS.flatMap((pattern) => [pattern.file, ...pattern.requires]))]
  .concat(SHARED_PATTERN_FILES.filter((file) => file.endsWith(".tsx")))
  .filter((file) => OWN_PATTERN_DIRS.some((dir) => file.startsWith(`${dir}/`)));

describe("pattern manifest", () => {
  it("points every pattern, requirement and effect at a file on disk", () => {
    const effectIds = new Set(EFFECTS.map((effect) => effect.id));
    for (const pattern of PATTERNS) {
      expect(existsSync(path.join(PATTERNS_SOURCE_DIR, pattern.file))).toBe(true);
      for (const file of pattern.requires) expect(existsSync(path.join(PATTERNS_SOURCE_DIR, file))).toBe(true);
      for (const id of pattern.effects) expect(effectIds.has(id)).toBe(true);
    }
    for (const effect of EFFECTS) expect(existsSync(path.join(PATTERNS_SOURCE_DIR, effect.file))).toBe(true);
  });

  it("links every catalog pattern section to code that renders its data-section marker", () => {
    const withPattern = SECTION_CATALOG.filter((section) => section.patternId !== undefined);
    expect(withPattern.length).toBe(PATTERNS.length);
    for (const section of withPattern) {
      const pattern = patternById(section.patternId ?? "");
      expect(pattern).toBeDefined();
      if (!pattern) continue;
      expect(source(pattern.file)).toContain(`data-section="${section.id}"`);
    }
  });

  it("keeps our own pattern code on theme tokens with no hex colours or bracket values", () => {
    for (const file of ownFiles) {
      const text = source(file);
      expect({ file, hex: HEX_COLOUR.test(text) }).toEqual({ file, hex: false });
      expect({ file, bracket: BRACKET_VALUE.test(text) }).toEqual({ file, bracket: false });
    }
  });

  it("keeps fixed colours out of patterns except the shared on-image scrim", () => {
    for (const file of ownFiles) {
      expect({ file, raw: RAW_PALETTE_CLASS.test(source(file)) }).toEqual({ file, raw: false });
    }
    expect(RAW_PALETTE_CLASS.test(source(ON_IMAGE_FILE))).toBe(true);
  });

  it("follows the motion rules: named transitions, no scale from zero, shared easing tokens", () => {
    const motionTokens = "shared/motion.ts";
    for (const file of [...ownFiles, motionTokens]) {
      const text = source(file);
      expect({ file, all: /transition-all|transition:\s*all/.test(text) }).toEqual({ file, all: false });
      expect({ file, zero: /\bscale-0\b|scale\(0\)|scale:\s*0[,\s}]/.test(text) }).toEqual({ file, zero: false });
      if (file === motionTokens) continue;
      expect({ file, ownCurve: /\[\s*0?\.\d+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*\]/.test(text) }).toEqual({ file, ownCurve: false });
    }
  });

  it("reads reduced motion through the hydration-safe hook in our own patterns", () => {
    for (const file of ownFiles) expect({ file, framerHook: /\buseReducedMotion\b/.test(source(file)) }).toEqual({ file, framerHook: false });
  });

  it("gives every long-running loop a pause control", () => {
    const marquee = source("editorial/marquee-band.tsx");
    expect(marquee).toContain("aria-pressed");
    expect(marquee).toContain("usePrefersReducedMotion");
  });

  it("guards every animated pattern with reduced motion, itself or through its effects", () => {
    const effectFileById = new Map(EFFECTS.map((effect) => [effect.id, effect.file]));
    const guard = /usePrefersReducedMotion|useReducedMotion|motion-reduce:|motion-safe:|prefers-reduced-motion|<Reveal|entrance=/;
    for (const pattern of PATTERNS.filter((entry) => entry.motion !== "none")) {
      const effectFiles = pattern.effects.flatMap((id) => effectFileById.get(id) ?? []);
      const isGuarded = guard.test(source(pattern.file)) || (effectFiles.length > 0 && effectFiles.every((file) => guard.test(source(file))));
      expect({ file: pattern.file, isGuarded }).toEqual({ file: pattern.file, isGuarded: true });
    }
  });
});

describe("planPatternDelivery", () => {
  it("delivers the chosen patterns with shared files and effects, sorted and without duplicates", () => {
    const plan = planPatternDelivery(["commerce.product-grid", "commerce.product-rail", "hero.editorial", "hero.editorial"]);
    const sources = plan.files.map((file) => file.source);
    expect(sources).toEqual([...sources].sort());
    expect(sources).toContain("commerce/product-card.tsx");
    expect(sources).toContain("commerce/rail-progress.tsx");
    expect(sources).toContain("effects/text/blur-text.tsx");
    expect(sources).toContain("shared/media.tsx");
    expect(sources.filter((file) => file === "commerce/product-card.tsx")).toHaveLength(1);
    expect(sources).not.toContain("hero/cinematic-hero.tsx");
    expect(plan.files.every((file) => file.target === `src/components/patterns/${file.source}`)).toBe(true);
  });

  it("reports ids without code and delivers nothing when no pattern matched", () => {
    const plan = planPatternDelivery(["pricing.columns"]);
    expect(plan.files).toEqual([]);
    expect(plan.skipped).toEqual([{ id: "pricing.columns", reason: "No pattern code for section pricing.columns" }]);
  });
});

describe("adaptEffectSource", () => {
  const effect = VENDORED_EFFECTS[0];

  it("drops the client directive and points imports at the template", () => {
    if (!effect) throw new Error("no effect sources");
    const adapted = adaptEffectSource(
      `'use client';\n\nimport { motion } from 'motion/react';\nimport { cn } from "@/lib/utils";\nimport React from "react";\n`,
      effect,
    );
    expect(adapted.startsWith("import")).toBe(true);
    expect(adapted).toContain('from "framer-motion"');
    expect(adapted).toContain('from "@/components/ui/utils"');
  });

  it("fails loudly when a patch no longer matches upstream", () => {
    if (!effect) throw new Error("no effect sources");
    expect(() => adaptEffectSource("export const Spotlight = () => null;\n", effect)).toThrow(/no longer matches/);
  });
});

describe("readPatternFiles", () => {
  it("marks only component files as client modules so server pages can import constants", async () => {
    const { readPatternFiles } = await import("../src/server");
    const files = await readPatternFiles(
      [
        { source: "shared/motion.ts", target: "src/components/patterns/shared/motion.ts" },
        { source: "shared/reveal.tsx", target: "src/components/patterns/shared/reveal.tsx" },
      ],
      { useClientDirective: true },
    );
    expect(files.find((file) => file.path.endsWith("motion.ts"))?.content.startsWith('"use client"')).toBe(false);
    expect(files.find((file) => file.path.endsWith("reveal.tsx"))?.content.startsWith('"use client";')).toBe(true);
  });
});
