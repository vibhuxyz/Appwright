import type { CanonicalResource } from "./types";

// Same primitive answers two different questions elsewhere: reads ∩ owns
// is a dependency edge (D30); owns ∩ owns is a scheduling conflict that
// must serialise (D30, D37). Non-file resources overlap only on an exact
// identifier match — there is no sub-path containment for `db:app`.
export function resourcesOverlap(a: CanonicalResource, b: CanonicalResource): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind !== "file") return a.value === b.value;
  if (a.value === b.value) return true;
  return a.value.startsWith(`${b.value}/`) || b.value.startsWith(`${a.value}/`);
}

export function anyResourceOverlaps(
  a: readonly CanonicalResource[],
  b: readonly CanonicalResource[],
): boolean {
  return a.some((ra) => b.some((rb) => resourcesOverlap(ra, rb)));
}
