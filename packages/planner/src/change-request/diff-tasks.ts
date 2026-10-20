import type { TaskSpec } from "../compile";

export function diffAffectedTaskIds(
  previous: readonly TaskSpec[],
  next: readonly TaskSpec[],
): string[] {
  const previousById = new Map(previous.map((task) => [task.id, task]));
  return next
    .filter((task) => {
      const before = previousById.get(task.id);
      return !before || JSON.stringify(before) !== JSON.stringify(task);
    })
    .map((task) => task.id)
    .sort();
}
