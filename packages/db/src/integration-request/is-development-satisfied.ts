const CONNECTED_STATUS = "connected";
const CONFIGURED_STATUS = "configured";
const CONFIGURED_COUNTS_AS_DONE: ReadonlySet<string> = new Set(["google-oauth"]);

export function isDevelopmentSatisfied(provider: string, status: string | undefined): boolean {
  if (status === CONNECTED_STATUS) return true;
  return status === CONFIGURED_STATUS && CONFIGURED_COUNTS_AS_DONE.has(provider);
}
