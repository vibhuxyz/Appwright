import type { Job } from "@repo/db";

// Only worker/infrastructure failures (lease expiry, a crash before this
// function runs) get the requeue-and-retry treatment, in reapExpiredLeases.
// A stopReason reaching here means the job dispatched and ran to some stop
// point — "paused for budget" and "finished cleanly" are both a successful
// dispatch from the Job's point of view; the Session's own status and the
// persisted stop-notice message are what tell the user it's paused, not a
// retry of this Job.
export function jobStatusFor(stopReason: string): Job["status"] {
  if (stopReason === "cancelled") return "CANCELLED";
  if (stopReason === "fatalError") return "FAILED";
  return "SUCCEEDED";
}
