import { prisma } from "./prisma";
import type { Job, Prisma } from "../../generated/prisma/client";

const TERMINAL_STATUSES: Job["status"][] = ["SUCCEEDED", "FAILED", "CANCELLED"];

export async function enqueueJob(input: {
  sessionId: string;
  projectId: string;
  analysis?: Prisma.InputJsonObject;
}): Promise<Job> {
  return prisma.job.create({
    data: {
      sessionId: input.sessionId,
      projectId: input.projectId,
      ...(input.analysis ? { analysis: input.analysis } : {}),
    },
  });
}

// SELECT ... FOR UPDATE SKIP LOCKED: the standard Postgres job-queue claim.
// Two workers polling at once never claim the same row, and a locked row
// held by another worker's in-flight claim is skipped rather than waited on.
export async function claimNextJob(
  workerId: string,
  leaseDurationMs: number,
): Promise<Job | null> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Job"
      WHERE status = 'QUEUED'
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;
    const row = rows[0];
    if (!row) return null;

    return tx.job.update({
      where: { id: row.id },
      data: {
        status: "PROVISIONING",
        workerId,
        leaseExpiresAt: new Date(Date.now() + leaseDurationMs),
      },
    });
  });
}

export async function renewJobLease(
  jobId: string,
  workerId: string,
  leaseDurationMs: number,
): Promise<void> {
  await prisma.job.updateMany({
    where: { id: jobId, workerId },
    data: { leaseExpiresAt: new Date(Date.now() + leaseDurationMs) },
  });
}

export async function setJobStatus(
  jobId: string,
  status: Job["status"],
  fields?: { error?: string },
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: { status, error: fields?.error },
  });
}

// A worker that dies stops renewing its lease. Any other live worker's poll
// tick calls this first — it finds the orphaned row by its stale
// leaseExpiresAt alone, with no dependency on the dead worker ever reporting
// in. This is what makes "kill a worker mid-run" an ordinary transition
// instead of a stuck job.
export async function reapExpiredLeases(): Promise<number> {
  const now = new Date();

  const expired = await prisma.job.findMany({
    where: {
      status: { notIn: TERMINAL_STATUSES },
      leaseExpiresAt: { lt: now },
    },
    select: { id: true, retryCount: true, maxRetries: true },
  });

  let reaped = 0;
  for (const job of expired) {
    const exceededRetries = job.retryCount >= job.maxRetries;
    const result = await prisma.job.updateMany({
      where: { id: job.id, leaseExpiresAt: { lt: now } },
      data: exceededRetries
        ? {
            status: "FAILED",
            error: `Exceeded max retries (${job.maxRetries}): worker lease expired`,
          }
        : {
            status: "QUEUED",
            workerId: null,
            leaseExpiresAt: null,
            retryCount: job.retryCount + 1,
          },
    });
    reaped += result.count;
  }

  return reaped;
}

export async function getJob(jobId: string): Promise<Job | null> {
  return prisma.job.findUnique({ where: { id: jobId } });
}
