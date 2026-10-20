import type { DesignChange } from "../schemas/editor-schemas";

export interface PendingSummary {
  readonly changeCount: number;
  readonly componentCount: number;
}

export function summarizePending(
  changes: readonly DesignChange[],
  intentComponentIds: readonly string[],
): PendingSummary {
  const components = new Set([...changes.map((change) => change.componentId), ...intentComponentIds]);
  return { changeCount: changes.length + intentComponentIds.length, componentCount: components.size };
}

export function formatPending({ changeCount, componentCount }: PendingSummary): string {
  const changes = `${changeCount} pending ${changeCount === 1 ? "change" : "changes"}`;
  return `${changes} · ${componentCount} ${componentCount === 1 ? "component" : "components"}`;
}

export function changesFor(
  changes: readonly DesignChange[],
  componentId: string,
): ReadonlyMap<string, DesignChange> {
  return new Map(
    changes
      .filter((change) => change.componentId === componentId)
      .map((change) => [`${change.property}:${change.breakpoint}`, change]),
  );
}
