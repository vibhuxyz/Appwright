import type { Blueprint, ProjectType } from "@repo/contracts";
import { applyComposition } from "@repo/ui-system";
import { normalizeProjectType } from "../universal/project-type";

function projectTypeFor(blueprint: Blueprint): ProjectType {
  if (blueprint.projectType && blueprint.projectType !== "other") return blueprint.projectType;
  const text = blueprint.pages.map((page) => page.purpose).join(" ");
  return normalizeProjectType(blueprint.intent, text);
}

export function withComposition(blueprint: Blueprint): Blueprint {
  return applyComposition(blueprint, projectTypeFor(blueprint));
}
