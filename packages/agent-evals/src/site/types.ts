import type { Blueprint } from "@repo/contracts";

export type SiteGroup = "A" | "B" | "C";
export type RepairMode = "off" | "production";
export type ArtDirection = "fashion" | "saas" | "portfolio" | "local-business";

export interface SiteBrief {
  readonly id: ArtDirection;
  readonly prompt: string;
}

export interface GroupConfig {
  readonly group: SiteGroup;
  readonly pipeline: "task" | "single-pass";
  readonly shellPatterns: "included" | "omitted" | "not-applicable";
}

export interface SpendEntry {
  readonly label: string;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cachedInputTokens: number;
  readonly costUsd: number;
}

export interface PlannedSite {
  readonly briefId: ArtDirection;
  readonly blueprint: Blueprint;
}
