import { reapDueDatabaseDeletions } from "@repo/db";
import { createLogger } from "@repo/logger";

// Periodic housekeeping — not event-driven, so it doesn't touch
// @repo/events. Register real jobs in `jobs` as they're needed (expired
// session sweep, stale `.workspaces/` cleanup, ...).

const log = createLogger("worker-maintenance");

interface Job {
  name: string;
  intervalMs: number;
  run: () => Promise<void>;
}

const jobs: Job[] = [
  {
    name: "reap-project-databases",
    intervalMs: 60 * 60 * 1000,
    run: async () => {
      const result = await reapDueDatabaseDeletions();
      if (result.completed > 0 || result.failed > 0) {
        log.info("reaped project databases", result);
      }
    },
  },
];

function schedule(job: Job) {
  log.info("job scheduled", { job: job.name, intervalMs: job.intervalMs });
  setInterval(() => {
    job
      .run()
      .catch((err) =>
        log.error("job failed", { job: job.name, err: String(err) }),
      );
  }, job.intervalMs);
}

if (import.meta.main) {
  log.info("worker-maintenance starting", { jobCount: jobs.length });
  jobs.forEach(schedule);
}
