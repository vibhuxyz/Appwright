import type { CanonicalResource } from "./types";

// D37: "breadth is a warning, not just a check" — src/** silently
// serialises the whole build. A real share-of-the-tree measurement needs
// a file count this module doesn't have; a one-segment file claim (`src`,
// `app`) is the honest proxy available without one.
const BROAD_SEGMENT_COUNT = 1;

export function isBroadOwnership(resource: CanonicalResource): boolean {
  if (resource.kind !== "file") return false;
  return resource.value.split("/").length <= BROAD_SEGMENT_COUNT;
}
