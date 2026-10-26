import type { Blueprint } from "@repo/contracts";
import { MAX_SINGLE_PASS_PAGES, STORED_DATA_FEATURES } from "./constants";

function hasRequiredAdmin(blueprint: Blueprint): boolean {
  return (blueprint.requirements ?? []).some(
    (requirement) => requirement.area === "admin" && requirement.level === "required",
  );
}

export function isSinglePassBlueprint(blueprint: Blueprint): boolean {
  if (blueprint.stack.db !== "none") return false;
  if (blueprint.features.some((feature) => STORED_DATA_FEATURES.has(feature))) return false;
  if (hasRequiredAdmin(blueprint)) return false;
  return blueprint.pages.length <= MAX_SINGLE_PASS_PAGES;
}
