export type PollOutcome<T> =
  | { status: "resolved"; value: T }
  | { status: "timeout" }
  | { status: "aborted" };

function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    signal.addEventListener("abort", finish, { once: true });
  });
}

export async function pollUntil<T>(input: {
  check: () => Promise<T | null>;
  signal: AbortSignal;
  timeoutMs: number;
  pollMs: number;
  now?: () => number;
}): Promise<PollOutcome<T>> {
  const now = input.now ?? Date.now;
  const deadline = now() + input.timeoutMs;
  while (!input.signal.aborted) {
    const value = await input.check();
    if (value !== null) return { status: "resolved", value };
    const remainingMs = deadline - now();
    if (remainingMs <= 0) return { status: "timeout" };
    await pause(Math.min(input.pollMs, remainingMs), input.signal);
  }
  return { status: "aborted" };
}
