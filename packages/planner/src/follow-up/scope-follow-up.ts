import type { Blueprint } from "@repo/contracts";
import { compileTasks } from "../compile";
import { diffAffectedTaskIds } from "../change-request";
import type { FollowUpScope } from "./types";

function isStackChanged(current: Blueprint, proposed: Blueprint): boolean {
  return JSON.stringify(current.stack) !== JSON.stringify(proposed.stack);
}

export function scopeFollowUp(
  current: Blueprint,
  proposed: Blueprint,
): FollowUpScope {
  const currentTasks = compileTasks(current);
  const proposedTasks = compileTasks(proposed);
  const currentIds = new Set(currentTasks.map((task) => task.id));
  const affectedTaskIds = diffAffectedTaskIds(currentTasks, proposedTasks);
  const newTaskIds = affectedTaskIds.filter((id) => !currentIds.has(id));
  const affected = new Set(affectedTaskIds);
  const untouchedTaskIds = proposedTasks
    .map((task) => task.id)
    .filter((id) => !affected.has(id))
    .sort();

  if (isStackChanged(current, proposed)) {
    return { kind: "architecture", requiresConfirmation: true, affectedTaskIds, newTaskIds, untouchedTaskIds };
  }
  const kind = newTaskIds.length > 0 ? "feature" : "cosmetic";
  return { kind, requiresConfirmation: false, affectedTaskIds, newTaskIds, untouchedTaskIds };
}
