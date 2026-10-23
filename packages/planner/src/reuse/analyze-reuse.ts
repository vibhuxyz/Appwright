import type { TaskSpec } from "../compile";
import { REUSE_REGISTRY } from "./registry";
import type { ReuseReportEntry } from "./types";

function capabilityForType(type: TaskSpec["type"]) {
  return REUSE_REGISTRY.find((entry) => entry.taskTypes.includes(type));
}

export function analyzeReuseForTasks(tasks: readonly TaskSpec[]): ReuseReportEntry[] {
  return tasks.map((task) => {
    const match = capabilityForType(task.type);
    if (!match) {
      return {
        taskId: task.id,
        taskTitle: task.title,
        taskType: task.type,
        action: "generate",
        capability: null,
        evidence: `No reusable capability registered for task type "${task.type}"`,
      };
    }
    return {
      taskId: task.id,
      taskTitle: task.title,
      taskType: task.type,
      action: match.action,
      capability: match.id,
      evidence: match.evidence,
    };
  });
}
