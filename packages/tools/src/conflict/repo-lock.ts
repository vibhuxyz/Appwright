const tails = new Map<string, Promise<unknown>>();

export function withRepoLock<T>(
  repoDir: string,
  task: () => Promise<T>,
): Promise<T> {
  const previous = tails.get(repoDir) ?? Promise.resolve();
  const run = previous.then(task, task);
  const tail = run.catch(() => undefined);
  tails.set(repoDir, tail);
  void tail.then(() => {
    if (tails.get(repoDir) === tail) tails.delete(repoDir);
  });
  return run;
}
