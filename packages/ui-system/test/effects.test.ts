import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { EFFECTS, PATTERNS, planPatternDelivery } from "../src";
import { PATTERNS_SOURCE_DIR } from "../src/server";
import { createParticles, stepParticles } from "../patterns/effects/canvas/particles";

const KNOWN_TEST_IDS = new Set([
  "effects:own-contract",
  "patterns:reduced-motion-guard",
  "patterns:pause-control",
  "eval:drag-card",
  "eval:image-compare-keyboard",
  "eval:image-compare-labels",
  "eval:canvas-reduced-motion",
]);
const HEX_COLOUR = /#[0-9a-fA-F]{3,8}\b/;
const BRACKET_VALUE = /[a-zA-Z0-9_-]+-\[[^[\]]+\]/;
const GLOBAL_POINTER_LISTENER = /(?:window|document)\.addEventListener\(\s*["'](?:pointermove|mousemove|touchmove)/;
const REDUCED_MOTION_GUARD = /usePrefersReducedMotion|<input|feTurbulence|motion-reduce:/;

function source(file: string): string {
  return readFileSync(path.join(PATTERNS_SOURCE_DIR, file), "utf8");
}

const ownEffects = EFFECTS.filter((effect) => effect.vendor === undefined);

describe("effect registry", () => {
  it("points every effect and its requirements at files on disk", () => {
    for (const effect of EFFECTS) {
      for (const file of [effect.file, ...effect.requires]) {
        expect({ effect: effect.id, file, exists: existsSync(path.join(PATTERNS_SOURCE_DIR, file)) }).toEqual({ effect: effect.id, file, exists: true });
      }
    }
  });

  it("describes every effect completely, with ids unique and tests that exist", () => {
    expect(new Set(EFFECTS.map((effect) => effect.id)).size).toBe(EFFECTS.length);
    for (const effect of EFFECTS) {
      expect({ id: effect.id, hasDirections: effect.directions.length > 0, hasTriggers: effect.triggers.length > 0 }).toEqual({ id: effect.id, hasDirections: true, hasTriggers: true });
      for (const field of [effect.purpose, effect.options, effect.touch, effect.reducedMotion, effect.fallback]) expect(field.length).toBeGreaterThan(0);
      for (const testId of effect.testIds) expect({ id: effect.id, testId, known: KNOWN_TEST_IDS.has(testId) }).toEqual({ id: effect.id, testId, known: true });
    }
  });

  it("gives every pattern effect id a registry entry", () => {
    const ids = new Set(EFFECTS.map((effect) => effect.id));
    for (const pattern of PATTERNS) for (const id of pattern.effects) expect(ids.has(id)).toBe(true);
  });
});

describe("own effects (effects:own-contract)", () => {
  it("use theme tokens, no hex colours, no bracket values and no global pointer listeners", () => {
    for (const effect of ownEffects) {
      const text = source(effect.file);
      expect({ file: effect.file, hex: HEX_COLOUR.test(text), bracket: BRACKET_VALUE.test(text), globalPointer: GLOBAL_POINTER_LISTENER.test(text) }).toEqual({
        file: effect.file,
        hex: false,
        bracket: false,
        globalPointer: false,
      });
    }
  });

  it("read reduced motion through the hydration-safe hook or need no motion", () => {
    for (const effect of ownEffects) {
      const text = source(effect.file);
      expect({ file: effect.file, guarded: REDUCED_MOTION_GUARD.test(text), framerHook: /\buseReducedMotion\b/.test(text) }).toEqual({ file: effect.file, guarded: true, framerHook: false });
    }
  });

  it("stops continuous effects off screen and in background tabs", () => {
    const continuous = ownEffects.filter((effect) => effect.triggers.includes("continuous"));
    expect(continuous.length).toBeGreaterThan(0);
    for (const effect of continuous) {
      const text = source(effect.file);
      expect({ file: effect.file, offScreen: /IntersectionObserver|useInView/.test(text) }).toEqual({ file: effect.file, offScreen: true });
    }
    expect(source("effects/canvas/particle-field.tsx")).toContain("document.hidden");
  });

  it("delivers a plan-selected effect with its requirements and reports unknown ids", () => {
    const plan = planPatternDelivery([], ["particle-field", "particle-field", "sparkles"]);
    const sources = plan.files.map((file) => file.source);
    expect(sources).toContain("effects/canvas/particle-field.tsx");
    expect(sources).toContain("effects/canvas/particles.ts");
    expect(sources).toContain("shared/reduced-motion.ts");
    expect(sources).not.toContain("effects/pointer/draggable-cards.tsx");
    expect(plan.effects.map((effect) => effect.id)).toEqual(["particle-field"]);
    expect(plan.skipped).toEqual([{ id: "sparkles", reason: "No effect code for sparkles (needed by the experience plan)" }]);
  });
});

describe("particles", () => {
  it("caps the count, is deterministic and keeps particles inside the box", () => {
    const first = createParticles(4000, 4000, 1.5);
    expect(first.length).toBe(140);
    expect(createParticles(4000, 4000, 1.5)).toEqual(first);
    const stepped = Array.from({ length: 50 }).reduce<typeof first>((current) => stepParticles(current, { width: 4000, height: 4000, pointer: { x: 2000, y: 2000 } }), first);
    expect(stepped.every((particle) => particle.x >= 0 && particle.x <= 4000 && particle.y >= 0 && particle.y <= 4000)).toBe(true);
  });

  it("pushes particles away from the pointer", () => {
    const [particle] = stepParticles([{ x: 110, y: 100, velocityX: 0, velocityY: 0, radius: 1 }], { width: 400, height: 400, pointer: { x: 100, y: 100 } });
    expect(particle?.velocityX ?? 0).toBeGreaterThan(0);
  });
});
