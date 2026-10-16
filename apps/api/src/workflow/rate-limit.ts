import { increment } from "@repo/cache";
import { prisma } from "@repo/db";

const REQUESTS_PER_MINUTE_WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_MINUTE = 20;
const MAX_CONCURRENT_SANDBOXES_PER_USER = 5;

const ACTIVE_STATUSES = ["RUNNING", "AWAITING_APPROVAL"] as const;

// Same primitive as the login rate limit in routes/auth.ts: an atomic
// fixed-window counter, fail-open on a Redis outage rather than blocking
// every request on the cache being up.
export async function conversationRateLimitOk(userId: string): Promise<boolean> {
  try {
    const count = await increment(
      `ratelimit:conversation:${userId}`,
      REQUESTS_PER_MINUTE_WINDOW_SECONDS,
    );
    return count <= MAX_REQUESTS_PER_MINUTE;
  } catch {
    return true;
  }
}

// Per-user, across every project — distinct from hasRunCapacity in
// run-limit.ts, which caps concurrency within one project. A user with many
// projects could otherwise hold far more than their fair share of sandboxes.
export async function hasUserSandboxCapacity(userId: string): Promise<boolean> {
  const activeRuns = await prisma.session.count({
    where: {
      project: { userId },
      status: { in: [...ACTIVE_STATUSES] },
    },
  });
  return activeRuns < MAX_CONCURRENT_SANDBOXES_PER_USER;
}
