import type { SectionPurpose } from "@repo/contracts";
import type { SectionEntry } from "../registry";
import { selectForPurpose, type RankContext } from "./rank";

export function chooseAll(purposes: readonly SectionPurpose[], context: RankContext): SectionEntry[] {
  const chosen: SectionEntry[] = [];
  for (const purpose of purposes) {
    const previous = chosen[chosen.length - 1]?.layoutPattern ?? null;
    const pick = selectForPurpose(purpose, { ...context, previousLayout: previous });
    if (pick) chosen.push(pick);
  }
  return chosen;
}
