import type { Provider } from "../providers/types";
import type { VisualReview } from "./schema";

export interface ShotRef {
  readonly route: string;
  readonly viewport: string;
}

export interface ReviewShot extends ShotRef {
  readonly png: Uint8Array;
}

export interface ReviewOptions {
  readonly shots: readonly ReviewShot[];
  readonly provider?: Provider;
  readonly model?: string;
  readonly signal?: AbortSignal;
}

export type ReviewResult =
  | {
      readonly ok: true;
      readonly review: VisualReview;
      readonly reviewed: readonly ShotRef[];
      readonly skipped: readonly { readonly shot: ShotRef; readonly reason: string }[];
      readonly model: string;
      readonly promptVersion: string;
      readonly costUsd: number;
    }
  | { readonly ok: false; readonly reason: string };
