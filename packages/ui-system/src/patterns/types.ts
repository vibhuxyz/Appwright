import type { ArtDirection } from "@repo/contracts";

export type { ArtDirection };

export type EffectSourceId = "aceternity-ui" | "react-bits";

export type MotionLevel = "none" | "subtle" | "expressive";

export type EffectCategory = "typography" | "image" | "pointer" | "scroll" | "svg" | "canvas" | "ambient";
export type EffectTrigger = "load" | "scroll" | "view" | "hover" | "pointer" | "drag" | "keyboard" | "continuous";
export type PerformanceTier = "light" | "medium" | "heavy";
export type ScrollLevel = "reveal" | "choreography" | "interactive";

export interface VendorSource {
  readonly sourceId: EffectSourceId;
  readonly url: string;
  readonly patches?: readonly (readonly [string, string])[];
}

export interface EffectEntry {
  readonly id: string;
  readonly category: EffectCategory;
  readonly purpose: string;
  readonly directions: readonly ArtDirection[];
  readonly triggers: readonly EffectTrigger[];
  readonly file: string;
  readonly requires: readonly string[];
  readonly exportName: string;
  readonly dependencies: readonly string[];
  readonly options: string;
  readonly intensity: Exclude<MotionLevel, "none">;
  readonly level: ScrollLevel;
  readonly performance: PerformanceTier;
  readonly touch: string;
  readonly reducedMotion: string;
  readonly fallback: string;
  readonly testIds: readonly string[];
  readonly vendor?: VendorSource;
}

export type VendoredEffect = EffectEntry & { readonly vendor: VendorSource };

export interface PatternEntry {
  readonly id: string;
  readonly file: string;
  readonly exportName: string;
  readonly requires: readonly string[];
  readonly effects: readonly string[];
  readonly motion: MotionLevel;
  readonly usage: string;
  readonly antiPatterns: readonly string[];
}

export interface PatternFile {
  readonly source: string;
  readonly target: string;
}

export interface PatternDelivery {
  readonly files: readonly PatternFile[];
  readonly patterns: readonly PatternEntry[];
  readonly effects: readonly EffectEntry[];
  readonly skipped: readonly { readonly id: string; readonly reason: string }[];
}

export interface DeliveredFile {
  readonly path: string;
  readonly content: string;
}
