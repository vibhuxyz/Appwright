import type { Blueprint } from "@repo/contracts";
import { validateBlueprint } from "../blueprint";
import { compileTasks, type TaskSpec } from "../compile";
import type { PlanResult } from "../shared";
import { validateTaskGraph, type ValidatedGraph } from "../validate";

export interface Plan {
  blueprint: Blueprint;
  tasks: TaskSpec[];
  graph: ValidatedGraph;
}

export function planBlueprint(
  input: unknown,
  budgetCents?: number,
  allowedPackages?: readonly string[],
): PlanResult<Plan> {
  const blueprint = validateBlueprint(input, allowedPackages);
  if (!blueprint.ok) return blueprint;

  const tasks = compileTasks(blueprint.value);
  const graph = validateTaskGraph(tasks, budgetCents);
  if (!graph.ok) return graph;

  return {
    ok: true,
    value: { blueprint: blueprint.value, tasks, graph: graph.value },
  };
}
