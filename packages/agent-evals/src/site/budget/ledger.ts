import type { SpendEntry } from "../types";

export interface SpendCaps {
  readonly generationUsd: number;
  readonly totalUsd: number;
}

export class BudgetExceededError extends Error {
  constructor(
    readonly scope: "generation" | "total",
    readonly spentUsd: number,
    readonly capUsd: number,
  ) {
    super(`Stopped before exceeding the ${scope} cost cap: spent $${spentUsd.toFixed(4)} of $${capUsd.toFixed(2)}`);
    this.name = "BudgetExceededError";
  }
}

export class SpendLedger {
  private readonly allEntries: SpendEntry[] = [];
  private generationLabel = "";
  private lastCallCostUsd = 0;

  constructor(private readonly caps: SpendCaps) {}

  beginGeneration(label: string): void {
    this.generationLabel = label;
  }

  record(entry: Omit<SpendEntry, "label">): void {
    this.allEntries.push({ ...entry, label: this.generationLabel });
    this.lastCallCostUsd = entry.costUsd;
  }

  assertCanSpend(): void {
    const total = this.totalSpentUsd();
    if (total + this.lastCallCostUsd > this.caps.totalUsd) throw new BudgetExceededError("total", total, this.caps.totalUsd);
    const generation = this.generationSpentUsd();
    if (generation + this.lastCallCostUsd > this.caps.generationUsd) {
      throw new BudgetExceededError("generation", generation, this.caps.generationUsd);
    }
  }

  generationSpentUsd(): number {
    return this.sumFor(this.generationLabel);
  }

  totalSpentUsd(): number {
    return this.allEntries.reduce((sum, entry) => sum + entry.costUsd, 0);
  }

  entriesFor(label: string): SpendEntry[] {
    return this.allEntries.filter((entry) => entry.label === label);
  }

  entries(): readonly SpendEntry[] {
    return this.allEntries;
  }

  private sumFor(label: string): number {
    return this.entriesFor(label).reduce((sum, entry) => sum + entry.costUsd, 0);
  }
}
