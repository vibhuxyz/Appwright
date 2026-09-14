import { createLogger } from "@repo/logger";

// Periodic housekeeping — not event-driven, so it doesn't touch
// @repo/events. Register real jobs in `jobs` as they're needed (expired
// session sweep, stale `.workspaces/` cleanup, ...). Empty today: nothing in
// the schema has a TTL yet, and a job list with no jobs is the honest state,
// not a reason to invent placeholder cleanup work.

const log = createLogger("worker-maintenance");

interface Job {
  name: string;
  intervalMs: number;
  run: () => Promise<void>;
}

const jobs: Job[] = [];

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
