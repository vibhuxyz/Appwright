import type { ArtDirection } from "../types";

export interface PlanBenchSample {
  readonly briefId: ArtDirection;
  readonly repeat: number;
  readonly durationMs: number;
  readonly status: "ok" | "failed";
  readonly failure?: string;
  readonly costUsd: number;
  readonly pageCount: number;
  readonly taskCount: number;
}

export interface PlanBenchSummary {
  readonly runId: string;
  readonly model: string;
  readonly samples: readonly PlanBenchSample[];
  readonly okDurationsMs: { readonly p50: number | null; readonly p75: number | null; readonly max: number | null };
  readonly failedCount: number;
  readonly totalCostUsd: number;
}

export interface PlanBenchOptions {
  readonly runId: string;
  readonly briefs: readonly ArtDirection[];
  readonly repeats: number;
  readonly resultsRoot: string;
}
