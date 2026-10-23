import type { SectionEntry } from "../registry";
import { selectForPurpose, type RankContext } from "./rank";

export function repairLayouts(chosen: readonly SectionEntry[], context: RankContext): SectionEntry[] {
  const next = [...chosen];
  for (let index = 1; index < next.length; index += 1) {
    const previous = next[index - 1];
    const current = next[index];
    if (!previous || !current || previous.layoutPattern !== current.layoutPattern) continue;
    const alternative = selectForPurpose(current.purpose, {
      ...context,
      previousLayout: previous.layoutPattern,
      forbidId: current.id,
    });
    if (alternative && alternative.layoutPattern !== previous.layoutPattern) next[index] = alternative;
  }
  return next;
}
