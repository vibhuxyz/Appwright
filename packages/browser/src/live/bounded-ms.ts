export function boundedMs(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max)) return 0;
  return Math.max(0, Math.min(max, Math.floor(value)));
}
