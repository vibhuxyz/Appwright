import { effectById } from "./effects";
import { SHARED_PATTERN_FILES, patternById } from "./manifest";
import type { EffectEntry, PatternDelivery, PatternEntry } from "./types";

export const PATTERNS_TARGET_DIR = "src/components/patterns";

interface Skip {
  id: string;
  reason: string;
}

function effectFiles(effect: EffectEntry): string[] {
  return [effect.file, ...effect.requires];
}

function resolveEffects(ids: readonly string[], skipped: Skip[], owner: string): EffectEntry[] {
  return ids.flatMap((id) => {
    const effect = effectById(id);
    if (!effect) skipped.push({ id, reason: `No effect code for ${id} (needed by ${owner})` });
    return effect ? [effect] : [];
  });
}

function resolvePatterns(ids: readonly string[], skipped: Skip[]): PatternEntry[] {
  return [...new Set(ids)].sort().flatMap((id) => {
    const pattern = patternById(id);
    if (!pattern) skipped.push({ id, reason: `No pattern code for section ${id}` });
    return pattern ? [pattern] : [];
  });
}

export function patternImportPath(file: string): string {
  return `@/components/patterns/${file.replace(/\.tsx?$/, "")}`;
}

export function planPatternDelivery(patternIds: readonly string[], effectIds: readonly string[] = []): PatternDelivery {
  const skipped: Skip[] = [];
  const patterns = resolvePatterns(patternIds, skipped);
  const effects = [
    ...patterns.flatMap((pattern) => resolveEffects(pattern.effects, skipped, pattern.id)),
    ...resolveEffects([...new Set(effectIds)].sort(), skipped, "the experience plan"),
  ];
  if (patterns.length === 0 && effects.length === 0) return { files: [], patterns, effects: [], skipped };
  const sources = new Set<string>([
    ...SHARED_PATTERN_FILES,
    ...patterns.flatMap((pattern) => [pattern.file, ...pattern.requires]),
    ...effects.flatMap(effectFiles),
  ]);
  const files = [...sources].sort().map((source) => ({ source, target: `${PATTERNS_TARGET_DIR}/${source}` }));
  const uniqueEffects = [...new Map(effects.map((effect) => [effect.id, effect])).values()].sort((left, right) => (left.id < right.id ? -1 : 1));
  return { files, patterns, effects: uniqueEffects, skipped };
}
