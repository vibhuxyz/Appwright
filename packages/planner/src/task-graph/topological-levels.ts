import { CycleDetectedError } from "./types";

// Kahn's algorithm, grouped into levels so the scheduler can see what is
// parallelisable at each step, not just a single valid order. A cycle
// leaves nodes with in-degree > 0 forever — those are exactly the
// declarations that caused it (D30).
export function topologicalLevels(dependsOn: Map<string, string[]>): string[][] {
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const id of dependsOn.keys()) {
    inDegree.set(id, 0);
    dependents.set(id, []);
  }
  for (const [id, deps] of dependsOn) {
    inDegree.set(id, deps.length);
    for (const dep of deps) {
      dependents.get(dep)?.push(id);
    }
  }

  const levels: string[][] = [];
  const visited = new Set<string>();
  let frontier = [...inDegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id);

  while (frontier.length > 0) {
    levels.push(frontier);
    const next: string[] = [];
    for (const id of frontier) {
      visited.add(id);
      for (const dependent of dependents.get(id) ?? []) {
        const remaining = (inDegree.get(dependent) ?? 0) - 1;
        inDegree.set(dependent, remaining);
        if (remaining === 0) next.push(dependent);
      }
    }
    frontier = next;
  }

  if (visited.size !== dependsOn.size) {
    const unresolved = [...dependsOn.keys()].filter((id) => !visited.has(id));
    throw new CycleDetectedError(unresolved);
  }

  return levels;
}
