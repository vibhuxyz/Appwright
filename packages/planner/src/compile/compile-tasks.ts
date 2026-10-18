import type { Blueprint } from "@repo/contracts";
import { capabilityFor, riskTierFor, verificationFor } from "../task-policy";
import { draftTasks } from "./drafts";
import type { TaskSpec } from "./types";

export function compileTasks(blueprint: Blueprint): TaskSpec[] {
  return draftTasks(blueprint).map(({ key, ...draft }) => {
    const riskTier = riskTierFor(draft.type);
    return {
      id: key,
      ...draft,
      riskTier,
      capability: capabilityFor(draft.type),
      verification: verificationFor(riskTier),
    };
  });
}
