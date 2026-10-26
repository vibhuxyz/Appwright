export interface RunGuardStats {
  readonly cacheHits: number;
  readonly overwritesRefused: number;
  readonly missingImportRefusals: number;
  readonly importChecksSkipped: number;
}
