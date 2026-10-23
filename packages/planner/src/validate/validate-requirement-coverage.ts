import type { Blueprint } from "@repo/contracts";
import type { TaskSpec } from "../compile";
import type { PlanIssue } from "../shared";

export function requirementCoverageIssues(
  blueprint: Pick<Blueprint, "requirements">,
  tasks: readonly TaskSpec[],
): PlanIssue[] {
  const coveredTypes = new Set(tasks.map((task) => task.type));
  return (blueprint.requirements ?? [])
    .filter(
      (requirement) =>
        requirement.level === "required" && !coveredTypes.has(requirement.area),
    )
    .map((requirement) => ({
      code: "uncovered_requirement",
      message: `Requirement "${requirement.id}" (${requirement.area}) is required but no task covers it`,
    }));
}
