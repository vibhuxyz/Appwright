import type { PatternEntry } from "../types";
import { CORE_PATTERNS } from "./core";
import { CREATIVE_PATTERNS } from "./creative";

export const SHARED_PATTERN_FILES = [
  "shared/image-treatment.ts",
  "shared/masked-text.tsx",
  "shared/media.tsx",
  "shared/motion.ts",
  "shared/on-image.ts",
  "shared/reduced-motion.ts",
  "shared/reveal-state.ts",
  "shared/reveal.tsx",
] as const;
export const PATTERNS: readonly PatternEntry[] = [...CORE_PATTERNS, ...CREATIVE_PATTERNS];

const patternsById = new Map(PATTERNS.map((pattern) => [pattern.id, pattern]));

export function patternById(id: string): PatternEntry | undefined {
  return patternsById.get(id);
}
