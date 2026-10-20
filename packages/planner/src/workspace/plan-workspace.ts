import type { Blueprint } from "@repo/contracts";
import {
  BASE_DEPENDENCIES,
  DEPENDENCIES_BY_FEATURE,
  STACK_TEMPLATE_ID,
  THEME_TOKENS_PATH,
} from "./constants";
import type { WorkspacePlan } from "./types";

function renderThemeTokens(blueprint: Blueprint): string {
  return [
    ":root {",
    `  --color-primary: ${blueprint.theme.primary.toLowerCase()};`,
    "}",
    "",
  ].join("\n");
}

function dependenciesFor(features: readonly string[]): string[] {
  const implied = features.flatMap((feature) => DEPENDENCIES_BY_FEATURE[feature] ?? []);
  return [...new Set([...BASE_DEPENDENCIES, ...implied])].sort();
}

export function planWorkspace(blueprint: Blueprint): WorkspacePlan {
  return {
    templateId: STACK_TEMPLATE_ID,
    files: [{ path: THEME_TOKENS_PATH, content: renderThemeTokens(blueprint) }],
    dependencies: dependenciesFor(blueprint.features),
  };
}
