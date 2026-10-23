import { readUnsplashAccessKey } from "./access-key";
import { createUnsplashClient, type UnsplashClient } from "./client";

const clientsByKey = new Map<string, UnsplashClient>();
const UNCONFIGURED_KEY = "";

export function sharedUnsplashClient(env: Readonly<Record<string, string | undefined>> = process.env): UnsplashClient {
  const accessKey = readUnsplashAccessKey(env);
  const mapKey = accessKey ?? UNCONFIGURED_KEY;
  const existing = clientsByKey.get(mapKey);
  if (existing) return existing;
  const created = createUnsplashClient({ accessKey });
  clientsByKey.set(mapKey, created);
  return created;
}
