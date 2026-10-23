import type { Blueprint } from "@repo/contracts";
import { validateBlueprint } from "../blueprint";
import { compileTasks, withComposition, type TaskSpec } from "../compile";
import { analyzeReuseForTasks, type ReuseReportEntry } from "../reuse";
import type { PlanResult } from "../shared";
import {
  completenessIssues,
  requirementCoverageIssues,
  validateTaskGraph,
  type ValidatedGraph,
} from "../validate";

export interface Plan {
  blueprint: Blueprint;
  tasks: TaskSpec[];
  graph: ValidatedGraph;
  reuseReport: ReuseReportEntry[];
}

export function planBlueprint(
  input: unknown,
  budgetCents?: number,
  allowedPackages?: readonly string[],
): PlanResult<Plan> {
  const blueprint = validateBlueprint(input, allowedPackages);
  if (!blueprint.ok) return blueprint;

  const composed = withComposition(blueprint.value);
  const tasks = compileTasks(composed);
  const coverageIssues = [
    ...requirementCoverageIssues(composed, tasks),
    ...completenessIssues(composed),
  ];
  if (coverageIssues.length > 0) return { ok: false, issues: coverageIssues };

  const graph = validateTaskGraph(tasks, budgetCents);
  if (!graph.ok) return graph;

  const reuseReport = analyzeReuseForTasks(tasks);

  return {
    ok: true,
    value: { blueprint: composed, tasks, graph: graph.value, reuseReport },
  };
}
