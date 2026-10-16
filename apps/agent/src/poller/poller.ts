import {
  claimNextJob,
  reapExpiredLeases,
  renewJobLease,
  setJobStatus,
  type Job,
} from "@repo/db";
import { createLogger } from "@repo/logger";
import type { SandboxProvider } from "@repo/sandbox";
import { executeAgentJob } from "../worker";
import { jobStatusFor } from "./job-outcome";
import type { Poller, PollerOptions } from "./types";

const log = createLogger("agent-poller");
const DEFAULT_POLL_INTERVAL_MS = 1000;
const DEFAULT_LEASE_DURATION_MS = 30_000;
const DEFAULT_MAX_CONCURRENCY = 3;

export function startPoller(
  sandboxProvider: SandboxProvider,
  opts?: PollerOptions,
): Poller {
  const workerId =
    opts?.workerId ?? `agent-${Math.random().toString(36).slice(2, 8)}`;
  const pollIntervalMs = opts?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const leaseDurationMs = opts?.leaseDurationMs ?? DEFAULT_LEASE_DURATION_MS;
  const maxConcurrency = opts?.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY;

  let running = 0;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const runClaimedJob = async (job: Job): Promise<void> => {
    running++;
    try {
      await setJobStatus(job.id, "RUNNING");
      const result = await executeAgentJob(job, sandboxProvider, () =>
        renewJobLease(job.id, workerId, leaseDurationMs),
      );
      await setJobStatus(job.id, jobStatusFor(result.stopReason));
      log.info("job finished", { jobId: job.id, stopReason: result.stopReason });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await setJobStatus(job.id, "FAILED", { error: message }).catch(() => {});
      log.error("job crashed", { jobId: job.id, err: message });
    } finally {
      running--;
    }
  };

  const tick = async (): Promise<void> => {
    if (stopped) return;
    try {
      const reaped = await reapExpiredLeases();
      if (reaped > 0) log.info("reaped expired leases", { reaped });

      if (running < maxConcurrency) {
        const job = await claimNextJob(workerId, leaseDurationMs);
        if (job) {
          log.info("claimed job", { jobId: job.id, sessionId: job.sessionId });
          void runClaimedJob(job);
        }
      }
    } catch (err) {
      log.error("poller tick failed", { err: String(err) });
    } finally {
      if (!stopped) timer = setTimeout(tick, pollIntervalMs);
    }
  };

  timer = setTimeout(tick, 0);

  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
