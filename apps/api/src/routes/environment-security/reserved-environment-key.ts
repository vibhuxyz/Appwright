import { ALL_INTEGRATION_CREDENTIAL_KEYS } from "@repo/contracts";

const SYSTEM_KEY_PREFIX = "APPWRITE_";

export function isReservedEnvironmentKey(key: string): boolean {
  return key.startsWith(SYSTEM_KEY_PREFIX) || ALL_INTEGRATION_CREDENTIAL_KEYS.has(key);
}
