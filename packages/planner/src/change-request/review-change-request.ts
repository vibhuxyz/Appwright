import type { Blueprint } from "@repo/contracts";
import { validateBlueprint } from "../blueprint";
import { compileTasks, type TaskSpec } from "../compile";
import { diffAffectedTaskIds } from "./diff-tasks";
import type { ChangeRequest, ChangeRequestDecision } from "./types";

function touchesStack(patch: ChangeRequest["patch"]): boolean {
  return patch.stack !== undefined;
}

export function reviewChangeRequest(
  request: ChangeRequest,
  currentBlueprint: Blueprint,
  currentTasks: readonly TaskSpec[],
): ChangeRequestDecision {
  if (!currentTasks.some((task) => task.id === request.taskId)) {
    return {
      status: "rejected",
      reason: `Task "${request.taskId}" does not exist in the current plan`,
    };
  }
  const unknownBlocks = request.blocks.filter(
    (id) => !currentTasks.some((task) => task.id === id),
  );
  if (unknownBlocks.length > 0) {
    return {
      status: "rejected",
      reason: `Blocked task id(s) not found: ${unknownBlocks.join(", ")}`,
    };
  }

  const proposed = {
    ...currentBlueprint,
    ...request.patch,
    blueprintVersion: currentBlueprint.blueprintVersion + 1,
  };
  const validated = validateBlueprint(proposed);
  if (!validated.ok) {
    return {
      status: "rejected",
      reason: validated.issues.map((issue) => issue.message).join("; "),
    };
  }

  if (touchesStack(request.patch)) {
    return { status: "needs_confirmation", blueprint: validated.value };
  }

  return applyConfirmedChange(validated.value, currentTasks);
}

export function applyConfirmedChange(
  blueprint: Blueprint,
  currentTasks: readonly TaskSpec[],
): ChangeRequestDecision {
  const nextTasks = compileTasks(blueprint);
  return {
    status: "approved",
    blueprint,
    affectedTaskIds: diffAffectedTaskIds(currentTasks, nextTasks),
  };
}
