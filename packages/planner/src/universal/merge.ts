import type { Blueprint } from "@repo/contracts";
import { MAX_TOTAL_ENTITIES, MAX_TOTAL_PAGES } from "./constants";
import type { ProjectScope, SkippedAddition, TemplateAdditions } from "./types";

const PAYMENTS_FEATURE = "payments";

export interface MergeResult {
  readonly blueprint: Blueprint;
  readonly skipped: readonly SkippedAddition[];
}

function addUnique<T>(
  existing: readonly T[],
  incoming: readonly T[],
  options: { key: (item: T) => string; cap: number; kind: SkippedAddition["kind"] },
): { items: T[]; skipped: SkippedAddition[] } {
  const items = [...existing];
  const known = new Set(existing.map((item) => options.key(item).toLowerCase()));
  const skipped: SkippedAddition[] = [];
  for (const item of incoming) {
    const name = options.key(item);
    if (known.has(name.toLowerCase())) continue;
    if (items.length >= options.cap) {
      skipped.push({ kind: options.kind, name, reason: `limit of ${options.cap} reached` });
      continue;
    }
    known.add(name.toLowerCase());
    items.push(item);
  }
  return { items, skipped };
}

export function mergeAdditions(blueprint: Blueprint, additions: TemplateAdditions): MergeResult {
  const pages = addUnique(blueprint.pages, additions.pages, {
    key: (page) => page.route,
    cap: MAX_TOTAL_PAGES,
    kind: "page",
  });
  const entities = addUnique(blueprint.entities, additions.entities, {
    key: (entity) => entity.name,
    cap: MAX_TOTAL_ENTITIES,
    kind: "entity",
  });
  const features = addUnique(blueprint.features, additions.features, {
    key: (feature) => feature,
    cap: Number.MAX_SAFE_INTEGER,
    kind: "feature",
  });
  return {
    blueprint: {
      ...blueprint,
      pages: pages.items,
      entities: entities.items,
      features: features.items,
    },
    skipped: [...pages.skipped, ...entities.skipped, ...features.skipped],
  };
}

export function applyScopeConstraints(blueprint: Blueprint, scope: ProjectScope): MergeResult {
  if (!scope.isBrowseOnly || !blueprint.features.includes(PAYMENTS_FEATURE)) {
    return { blueprint, skipped: [] };
  }
  return {
    blueprint: {
      ...blueprint,
      features: blueprint.features.filter((feature) => feature !== PAYMENTS_FEATURE),
    },
    skipped: [
      {
        kind: "feature",
        name: PAYMENTS_FEATURE,
        reason: "the request is browse-only, so ordering and payments are out of scope",
      },
    ],
  };
}
