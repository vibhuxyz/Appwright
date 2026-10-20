export function parseConflictedPaths(mergeTreeOutput: string): string[] {
  const [, ...entries] = mergeTreeOutput.split("\0");
  const firstBlank = entries.indexOf("");
  const paths = firstBlank === -1 ? entries : entries.slice(0, firstBlank);
  return [...new Set(paths)].sort();
}
