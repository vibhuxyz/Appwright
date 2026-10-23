import type { TaskSpec } from "../compile";

export function tasksAlreadySatisfied(
  tasks: readonly TaskSpec[],
  existingPaths: ReadonlySet<string>,
): readonly TaskSpec["id"][] {
  return tasks
    .filter((task) => task.owns.length > 0 && task.owns.every((path) => existingPaths.has(path)))
    .map((task) => task.id);
}
