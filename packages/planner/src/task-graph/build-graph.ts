import { anyResourceOverlaps, canonicalizeDeclaration } from "../ownership";
import type { ComputedEdges, TaskGraphNode } from "./types";

// D30: the graph is computed, not authored. `reads ∩ another task's owns`
// is a dependency edge; `owns ∩ owns` is a scheduling conflict the
// scheduler must serialise. Both read from the same canonical resources,
// computed once per task here rather than per comparison.
export function buildTaskGraph(tasks: TaskGraphNode[]): ComputedEdges {
  const canonicalOwns = new Map(
    tasks.map((t) => [t.id, t.owns.map(canonicalizeDeclaration)]),
  );
  const canonicalReads = new Map(
    tasks.map((t) => [t.id, t.reads.map(canonicalizeDeclaration)]),
  );

  const dependsOn = new Map<string, string[]>();
  for (const task of tasks) {
    const reads = canonicalReads.get(task.id) ?? [];
    const deps: string[] = [];
    for (const other of tasks) {
      if (other.id === task.id) continue;
      const otherOwns = canonicalOwns.get(other.id) ?? [];
      if (anyResourceOverlaps(reads, otherOwns)) deps.push(other.id);
    }
    dependsOn.set(task.id, deps);
  }

  const ownershipConflicts: [string, string][] = [];
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const taskA = tasks[i];
      const taskB = tasks[j];
      if (!taskA || !taskB) continue;
      const ownsA = canonicalOwns.get(taskA.id) ?? [];
      const ownsB = canonicalOwns.get(taskB.id) ?? [];
      if (anyResourceOverlaps(ownsA, ownsB)) {
        ownershipConflicts.push([taskA.id, taskB.id]);
      }
    }
  }

  return { dependsOn, ownershipConflicts };
}
