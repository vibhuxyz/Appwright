export interface PrioritizedLine {
  readonly priority: number;
  readonly text: string;
}

function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

function sizeOf(lines: readonly PrioritizedLine[], indexes: readonly number[]): number {
  return indexes.reduce((used, index) => used + byteLength(lines[index]?.text ?? "") + 1, 0);
}

function dropIndex(lines: readonly PrioritizedLine[], indexes: readonly number[]): number {
  let chosen = -1;
  let priority = Number.POSITIVE_INFINITY;
  for (const index of indexes) {
    const value = lines[index]?.priority ?? 0;
    if (value < priority || (value === priority && index > chosen)) {
      priority = value;
      chosen = index;
    }
  }
  return chosen;
}

export function fitBriefLines(
  lines: readonly PrioritizedLine[],
  maxBytes: number,
): { kept: string[]; cutLines: number } {
  const selected = lines.map((_, index) => index);
  let guard = 0;
  while (sizeOf(lines, selected) > maxBytes && selected.length > 0 && guard < lines.length) {
    guard += 1;
    const drop = dropIndex(lines, selected);
    const at = selected.indexOf(drop);
    if (at < 0) break;
    selected.splice(at, 1);
  }
  return {
    kept: selected.flatMap((index) => {
      const text = lines[index]?.text;
      return text === undefined ? [] : [text];
    }),
    cutLines: lines.length - selected.length,
  };
}
