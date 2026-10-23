export interface TaskWithId<T> {
  task: T;
  id: string;
  dependsOn: string[];
}

export function assignTaskIds<T extends { id: string }>(
  tasks: readonly T[],
  dependsOnByKey: ReadonlyMap<string, readonly string[]>,
  makeId: () => string,
): TaskWithId<T>[] {
  const idByKey = new Map(tasks.map((task) => [task.id, makeId()]));
  return tasks.flatMap((task) => {
    const id = idByKey.get(task.id);
    if (!id) return [];
    const dependsOn = (dependsOnByKey.get(task.id) ?? []).flatMap((dependency) => {
      const dependencyId = idByKey.get(dependency);
      return dependencyId ? [dependencyId] : [];
    });
    return [{ task, id, dependsOn }];
  });
}
