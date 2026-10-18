import type { WaitReason } from "./types";

export function describeWait(reason: WaitReason): string {
  switch (reason.kind) {
    case "dependency":
      return `blocked on ${reason.blockedOn.join(", ")}`;
    case "upstream_failed":
      return `upstream failed: ${reason.failedDependencies.join(", ")}`;
    case "ownership":
      return `waiting on ${reason.conflictsWith} (overlapping ownership)`;
    case "capacity":
      return `waiting on capacity (${reason.maxConcurrent} running)`;
    case "budget":
      return `budget exhausted (${reason.remainingCents} cents left, ${reason.neededCents} needed)`;
    default: {
      const unreachable: never = reason;
      return unreachable;
    }
  }
}
