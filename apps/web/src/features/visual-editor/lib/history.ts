import type { Breakpoint, DesignChange } from "../schemas/editor-schemas";

export interface EditHistory {
  readonly past: readonly (readonly DesignChange[])[];
  readonly present: readonly DesignChange[];
  readonly future: readonly (readonly DesignChange[])[];
}

export const EMPTY_HISTORY: EditHistory = { past: [], present: [], future: [] };

const MAX_HISTORY_STEPS = 100;

function sameTarget(a: DesignChange, b: DesignChange): boolean {
  return a.componentId === b.componentId && a.property === b.property && a.breakpoint === b.breakpoint;
}

function commit(history: EditHistory, present: readonly DesignChange[]): EditHistory {
  return { past: [...history.past, history.present].slice(-MAX_HISTORY_STEPS), present, future: [] };
}

export function setChange(history: EditHistory, change: DesignChange): EditHistory {
  const existing = history.present.find((entry) => sameTarget(entry, change));
  const original = existing?.from ?? change.from;
  const others = history.present.filter((entry) => !sameTarget(entry, change));
  const next = change.to === original ? others : [...others, { ...change, from: original }];
  return commit(history, next);
}

export function revertChange(
  history: EditHistory,
  target: { componentId: string; property: string; breakpoint: Breakpoint },
): EditHistory {
  const next = history.present.filter((entry) => !sameTarget(entry, { ...target, from: "", to: "" }));
  return next.length === history.present.length ? history : commit(history, next);
}

export function undo(history: EditHistory): EditHistory {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo(history: EditHistory): EditHistory {
  const [next, ...rest] = history.future;
  if (next === undefined) return history;
  return { past: [...history.past, history.present], present: next, future: rest };
}
