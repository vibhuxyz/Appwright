import {
  InvalidOwnershipDeclarationError,
  canonicalizeDeclaration,
  isBroadOwnership,
} from "../ownership";
import type { TaskSpec } from "../compile";
import type { PlanIssue, PlanResult } from "../shared";
import {
  buildTaskGraph,
  CycleDetectedError,
  topologicalLevels,
} from "../task-graph";
import { MAX_TASKS_PER_PLAN } from "./constants";
import type { ValidatedGraph } from "./types";

function duplicateIdIssues(tasks: readonly TaskSpec[]): PlanIssue[] {
  const seen = new Set<string>();
  const issues: PlanIssue[] = [];
  for (const task of tasks) {
    if (seen.has(task.id)) {
      issues.push({
        code: "duplicate_task_id",
        message: `Task id "${task.id}" is used more than once`,
      });
    }
    seen.add(task.id);
  }
  return issues;
}

function ownershipIssues(tasks: readonly TaskSpec[]): PlanIssue[] {
  const issues: PlanIssue[] = [];
  for (const task of tasks) {
    for (const declaration of [...task.owns, ...task.reads]) {
      try {
        canonicalizeDeclaration(declaration);
      } catch (error) {
        if (!(error instanceof InvalidOwnershipDeclarationError)) throw error;
        issues.push({
          code: "invalid_ownership",
          message: `Task "${task.id}": ${error.message}`,
        });
      }
    }
  }
  return issues;
}

function broadOwnershipWarnings(tasks: readonly TaskSpec[]): PlanIssue[] {
  return tasks
    .filter((task) =>
      task.owns.some((d) => isBroadOwnership(canonicalizeDeclaration(d))),
    )
    .map((task) => ({
      code: "broad_ownership",
      message: `Task "${task.id}" claims a whole top-level directory and will serialise most of the build`,
    }));
}

function structuralIssues(tasks: readonly TaskSpec[]): PlanIssue[] {
  const issues: PlanIssue[] = [];
  if (tasks.length > MAX_TASKS_PER_PLAN) {
    issues.push({
      code: "too_many_tasks",
      message: `Plan has ${tasks.length} tasks, limit is ${MAX_TASKS_PER_PLAN}`,
    });
  }
  return [...issues, ...duplicateIdIssues(tasks), ...ownershipIssues(tasks)];
}

export function validateTaskGraph(
  tasks: readonly TaskSpec[],
): PlanResult<ValidatedGraph> {
  const issues = structuralIssues(tasks);
  if (issues.length > 0) return { ok: false, issues };

  const { dependsOn, ownershipConflicts } = buildTaskGraph([...tasks]);
  try {
    const levels = topologicalLevels(dependsOn);
    const warnings = broadOwnershipWarnings(tasks);
    return {
      ok: true,
      value: { dependsOn, levels, ownershipConflicts, warnings },
    };
  } catch (error) {
    if (!(error instanceof CycleDetectedError)) throw error;
    return {
      ok: false,
      issues: [{ code: "dependency_cycle", message: error.message }],
    };
  }
}
