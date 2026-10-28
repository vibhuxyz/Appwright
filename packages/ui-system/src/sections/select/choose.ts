import type { SectionPurpose } from "@repo/contracts";
import { densityOfLayout, motionOf } from "../compose";
import type { SectionEntry } from "../registry";
import { selectForPurpose, type RankContext } from "./rank";

function sequenceContext(chosen: readonly SectionEntry[], context: RankContext): RankContext {
  const previous = chosen[chosen.length - 1];
  return {
    ...context,
    previousLayout: previous?.layoutPattern ?? null,
    previousDensity: previous ? densityOfLayout(previous.layoutPattern) : null,
    previousMotion: previous ? motionOf(previous) : null,
    usedIds: new Set(chosen.map((entry) => entry.id)),
    expressiveCount: chosen.filter((entry) => motionOf(entry) === "expressive").length,
  };
}

export function chooseAll(purposes: readonly SectionPurpose[], context: RankContext): SectionEntry[] {
  const chosen: SectionEntry[] = [];
  for (const purpose of purposes) {
    const pick = selectForPurpose(purpose, sequenceContext(chosen, context));
    if (pick) chosen.push(pick);
  }
  return chosen;
}
