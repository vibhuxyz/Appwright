import { anyResourceOverlaps, canonicalizeDeclaration } from "@repo/planner";
import type { SchedulableTask, WaitReason } from "./types";

const FAILED_STATUSES: ReadonlySet<string> = new Set(["failed", "blocked"]);

export function dependencyGate(
  task: SchedulableTask,
  statusById: ReadonlyMap<string, SchedulableTask["status"]>,
): WaitReason | undefined {
  const failed = task.dependsOn.filter((id) =>
    FAILED_STATUSES.has(statusById.get(id) ?? ""),
  );
  if (failed.length > 0) {
    return { kind: "upstream_failed", failedDependencies: failed };
  }
  const pending = task.dependsOn.filter((id) => statusById.get(id) !== "done");
  if (pending.length > 0) return { kind: "dependency", blockedOn: pending };
  return undefined;
}

export function ownershipGate(
  task: SchedulableTask,
  active: readonly SchedulableTask[],
): WaitReason | undefined {
  const mine = task.owns.map(canonicalizeDeclaration);
  const conflict = active.find((other) =>
    anyResourceOverlaps(mine, other.owns.map(canonicalizeDeclaration)),
  );
  return conflict
    ? { kind: "ownership", conflictsWith: conflict.id }
    : undefined;
}
