import Redis from "ioredis";

// Redis is fast ephemeral state — cache, rate limits, locks — never the
// source of truth. Postgres (via @repo/db) stays that. One lazy connection
// per process; nothing touches the network until the first cache call, so
// importing this package is free in services that never end up using it.

let client: Redis | undefined;

function getClient(): Redis {
  if (!client) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not set");
    client = new Redis(url, { maxRetriesPerRequest: 3 });
  }
  return client;
}

export async function get<T>(key: string): Promise<T | null> {
  const raw = await getClient().get(key);
  return raw === null ? null : (JSON.parse(raw) as T);
}

export async function set(
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<void> {
  const raw = JSON.stringify(value);
  if (ttlSeconds) {
    await getClient().set(key, raw, "EX", ttlSeconds);
  } else {
    await getClient().set(key, raw);
  }
}

export async function del(key: string): Promise<void> {
  await getClient().del(key);
}

// Read-through cache: return the cached value if present, otherwise compute,
// store, and return it. The common shape for "don't hit Postgres/an LLM
// twice for the same key within ttlSeconds".
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  const cached = await get<T>(key);
  if (cached !== null) return cached;
  const value = await compute();
  await set(key, value, ttlSeconds);
  return value;
}

// Atomic fixed-window counter — INCR, then EXPIRE only on the request that
// created the key. Setting the TTL on every call instead would reset the
// window on every request and the count would never expire under continuous
// traffic, which is exactly the traffic a rate limit exists to bound. This
// is the primitive a rate limiter needs; get()+set() would race two
// concurrent requests into both reading 0.
export async function increment(
  key: string,
  ttlSeconds: number,
): Promise<number> {
  const client = getClient();
  const count = await client.incr(key);
  if (count === 1) await client.expire(key, ttlSeconds);
  return count;
}

// Cooperative lock, not a fencing token — good enough for "don't run this
// job twice concurrently", not for correctness-critical mutual exclusion.
export async function withLock<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T | null> {
  const acquired = await getClient().set(
    `lock:${key}`,
    "1",
    "EX",
    ttlSeconds,
    "NX",
  );
  if (acquired !== "OK") return null;
  try {
    return await fn();
  } finally {
    await getClient().del(`lock:${key}`);
  }
}

export { publishChannel, sessionChannel, subscribeChannel } from "./pubsub";
export { CANCEL_FLAG_TTL_SECONDS, cancelFlagKey } from "./cancel-flag";
export type {
  MessageHandler,
  Subscription,
  SseApprovalFrame,
  SseAssetRequestFrame,
  SseDeltaFrame,
  SseFrame,
  SseIntegrationConfigFrame,
  SseAgentQuestionFrame,
  SseIntakeProgressFrame,
  SseMessageFrame,
  SseStatusFrame,
  SseUsageFrame,
  SseVerificationFrame,
} from "./pubsub";

