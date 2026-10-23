import { prisma } from "@repo/db";

const DEFAULT_POLL_MS = 1_000;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : new Error("aborted"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason instanceof Error ? signal.reason : new Error("aborted"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export async function waitUntilAssetRequestResolved(
  assetRequestId: string,
  signal: AbortSignal,
  pollMs = DEFAULT_POLL_MS,
): Promise<void> {
  while (!signal.aborted) {
    const row = await prisma.assetRequest.findUnique({
      where: { id: assetRequestId },
      select: { status: true },
    });
    if (!row || row.status === "RESOLVED") return;
    await sleep(pollMs, signal);
  }
  throw signal.reason instanceof Error ? signal.reason : new Error("aborted");
}
