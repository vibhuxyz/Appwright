import { motionOf } from "../compose";
import type { SectionEntry } from "../registry";
import { selectForPurpose, type RankContext } from "./rank";

function isExpressive(entry: SectionEntry): boolean {
  return motionOf(entry) === "expressive";
}

function calmerAlternative(entry: SectionEntry, context: RankContext): SectionEntry | undefined {
  if (entry.purpose === "hero") return undefined;
  const alternative = selectForPurpose(entry.purpose, { ...context, forbidId: entry.id });
  return alternative && !isExpressive(alternative) ? alternative : undefined;
}

function repairLayout(next: SectionEntry[], index: number, context: RankContext): void {
  const previous = next[index - 1];
  const current = next[index];
  if (!previous || !current || previous.layoutPattern !== current.layoutPattern) return;
  const alternative = selectForPurpose(current.purpose, {
    ...context,
    previousLayout: previous.layoutPattern,
    forbidId: current.id,
  });
  if (alternative && alternative.layoutPattern !== previous.layoutPattern) next[index] = alternative;
}

function repairMotion(next: SectionEntry[], index: number, context: RankContext): void {
  const previous = next[index - 1];
  const current = next[index];
  if (!previous || !current || !isExpressive(previous) || !isExpressive(current)) return;
  const usedIds = new Set(next.map((entry) => entry.id));
  const earlier = calmerAlternative(previous, { ...context, usedIds });
  if (earlier) {
    next[index - 1] = earlier;
    return;
  }
  const later = calmerAlternative(current, { ...context, usedIds });
  if (later) next[index] = later;
}

export function repairLayouts(chosen: readonly SectionEntry[], context: RankContext): SectionEntry[] {
  const next = [...chosen];
  for (let index = 1; index < next.length; index += 1) {
    repairLayout(next, index, context);
    repairMotion(next, index, context);
  }
  return next;
}
