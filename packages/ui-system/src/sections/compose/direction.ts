import type { ArtDirection, SectionEntry } from "../registry";
import { detectArtDirection } from "../direction";

const DIRECTION_PRIORITY: readonly ArtDirection[] = ["commerce", "editorial", "product", "local", "classic"];

export function directionOfSections(entries: readonly SectionEntry[], pagePurpose: string): ArtDirection {
  const tally = new Map<ArtDirection, number>();
  for (const entry of entries) {
    if (!entry.directions || entry.directions.length === DIRECTION_PRIORITY.length) continue;
    for (const direction of entry.directions) tally.set(direction, (tally.get(direction) ?? 0) + 1);
  }
  const best = DIRECTION_PRIORITY.reduce<ArtDirection | null>((top, direction) => {
    const count = tally.get(direction) ?? 0;
    if (count === 0) return top;
    return top === null || count > (tally.get(top) ?? 0) ? direction : top;
  }, null);
  return best ?? detectArtDirection(pagePurpose, "other");
}
