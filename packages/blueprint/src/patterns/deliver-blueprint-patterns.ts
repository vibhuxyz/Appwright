import type { Runtime } from "@repo/agent-core";
import type { Blueprint } from "@repo/contracts";
import { deliverSelection, type PatternDeliveryResult } from "./deliver-patterns";
import { effectIdsForPage, patternIdsForPage, shellSectionIdsFor } from "./pattern-ids-for-task";

export interface BlueprintDeliveryOptions {
  readonly shellPatterns?: "included" | "omitted";
}

export function deliverBlueprintPatterns(
  input: { blueprint: Blueprint; projectId: string },
  runtime: Runtime,
  projectTree: readonly string[],
  options: BlueprintDeliveryOptions = {},
): Promise<PatternDeliveryResult> {
  const { blueprint, projectId } = input;
  const shellIds = options.shellPatterns === "omitted" ? [] : shellSectionIdsFor(blueprint);
  const selection = {
    patternIds: [...shellIds, ...blueprint.pages.flatMap(patternIdsForPage)],
    effectIds: blueprint.pages.flatMap((page) => effectIdsForPage(page, blueprint.design, projectId)),
  };
  return deliverSelection(selection, runtime, projectTree);
}
