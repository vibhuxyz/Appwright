const DEFAULT_WARM_POOL_SIZE = 0;
const MAX_WARM_POOL_SIZE = 20;

export function readWarmPoolSize(raw: string | undefined): number {
  if (raw === undefined || raw === "") return DEFAULT_WARM_POOL_SIZE;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_WARM_POOL_SIZE) {
    throw new Error(
      `Invalid SANDBOX_WARM_POOL_SIZE: ${raw} (expected an integer from 0 to ${MAX_WARM_POOL_SIZE})`,
    );
  }
  return parsed;
}
