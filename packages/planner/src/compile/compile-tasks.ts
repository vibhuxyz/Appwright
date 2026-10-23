import type { Blueprint } from "@repo/contracts";
import { capabilityFor, riskTierFor, verificationFor } from "../task-policy";
import { draftTasks } from "./drafts";
import type { TaskSpec } from "./types";
import { withComposition } from "./with-composition";

export function compileTasks(blueprint: Blueprint): TaskSpec[] {
  return draftTasks(withComposition(blueprint)).map(({ key, ...draft }) => {
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
