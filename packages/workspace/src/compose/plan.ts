import { DEPENDENCIES_BY_CHOICE, THEME_CSS_PATH } from "./constants";
import { themeCss } from "./theme";
import type { ComposeInput, ComposePlan, FileWrite, SkippedInput } from "./types";

function planDependencies(choices: readonly string[]): {
  dependencies: string[];
  skipped: SkippedInput[];
} {
  const dependencies = new Set<string>();
  const skipped: SkippedInput[] = [];
  for (const choice of choices) {
    const packages = DEPENDENCIES_BY_CHOICE[choice];
    if (!packages) {
      skipped.push({
        input: choice,
        reason: `No dependencies registered for choice ${choice}`,
      });
      continue;
    }
    packages.forEach((name) => dependencies.add(name));
  }
  return { dependencies: [...dependencies].sort(), skipped };
}

export function planComposition(input: ComposeInput): ComposePlan {
  const { dependencies, skipped } = planDependencies(input.capabilityChoices);
  const css = themeCss(input.primaryHex);
  const writes: FileWrite[] = [];
  if (css === undefined) {
    skipped.push({
      input: input.primaryHex,
      reason: `Primary colour ${input.primaryHex} is not a #rrggbb hex`,
    });
  } else {
    writes.push({ path: THEME_CSS_PATH, content: css });
  }
  return { writes, dependencies, skipped };
}
