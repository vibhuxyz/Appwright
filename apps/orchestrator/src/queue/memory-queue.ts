import { transitionJob, type JobRecord } from "../state-machine";
import type { JobPayload, QueueOptions, QueueStats } from "./types";

export class MemoryQueue {
  private readonly jobs = new Map<string, JobRecord>();
  private readonly queueOrder: string[] = [];
  private readonly maxConcurrency: number;
  private readonly defaultMaxRetries: number;

  constructor(opts?: QueueOptions) {
    this.maxConcurrency = opts?.maxConcurrency ?? 5;
    this.defaultMaxRetries = opts?.defaultMaxRetries ?? 3;
  }

  enqueue(payload: JobPayload): JobRecord {
    const existing = this.jobs.get(payload.jobId);
    if (existing) return existing;

    const now = Date.now();
    const record: JobRecord = {
      id: payload.jobId,
      sessionId: payload.sessionId,
      projectId: payload.projectId,
      status: "queued",
      retryCount: 0,
      maxRetries: payload.maxRetries ?? this.defaultMaxRetries,
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(record.id, record);
    this.queueOrder.push(record.id);
    return record;
  }

  claim(workerId: string): JobRecord | null {
    if (this.runningCount() >= this.maxConcurrency) {
      return null;
    }

    const nextId = this.queueOrder.shift();
    if (!nextId) return null;

    const job = this.jobs.get(nextId);
    if (!job || job.status !== "queued") {
      return this.claim(workerId);
    }

    const nextStatus = transitionJob(job.status, { type: "CLAIM" });
    const now = Date.now();
    const updated: JobRecord = {
      ...job,
      status: nextStatus,
      workerId,
      updatedAt: now,
    };

    this.jobs.set(updated.id, updated);
    return updated;
  }

  requeue(jobId: string, reason: string): JobRecord | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const diedEventType = job.status === "provisioning" ? "PROVISION_FAILED" : "WORKER_DIED";

    if (job.retryCount >= job.maxRetries) {
      const failed = {
        ...job,
        status: transitionJob(job.status, { type: "UNRECOVERABLE_ERROR", reason }),
        error: `Exceeded max retries (${job.maxRetries}): ${reason}`,
        updatedAt: Date.now(),
      };
      this.jobs.set(jobId, failed);
      return failed;
    }

    const nextStatus = transitionJob(job.status, { type: diedEventType, reason });
    const now = Date.now();
    const requeued: JobRecord = {
      ...job,
      status: nextStatus,
      workerId: undefined,
      retryCount: job.retryCount + 1,
      updatedAt: now,
    };

    this.jobs.set(jobId, requeued);
    this.queueOrder.push(jobId);
    return requeued;
  }

  cancel(jobId: string, reason?: string): JobRecord | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const nextStatus = transitionJob(job.status, { type: "CANCEL", reason });
    const now = Date.now();
    const cancelled: JobRecord = {
      ...job,
      status: nextStatus,
      updatedAt: now,
    };

    this.jobs.set(jobId, cancelled);
    return cancelled;
  }

  updateStatus(jobId: string, updater: (record: JobRecord) => JobRecord): JobRecord {
    const current = this.jobs.get(jobId);
    if (!current) throw new Error(`Job not found: ${jobId}`);
    const updated = updater(current);
    this.jobs.set(jobId, updated);
    return updated;
  }

  getJob(jobId: string): JobRecord | undefined {
    return this.jobs.get(jobId);
  }

  runningCount(): number {
    let count = 0;
    for (const job of this.jobs.values()) {
      if (
        job.status === "provisioning" ||
        job.status === "running" ||
        job.status === "verifying" ||
        job.status === "awaiting_approval"
      ) {
        count++;
      }
    }
    return count;
  }

  getStats(): QueueStats {
    const stats: QueueStats = {
      queued: 0,
      running: 0,
      succeeded: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const job of this.jobs.values()) {
      if (job.status === "queued") stats.queued++;
      else if (job.status === "succeeded") stats.succeeded++;
      else if (job.status === "failed") stats.failed++;
      else if (job.status === "cancelled") stats.cancelled++;
      else stats.running++;
    }

    return stats;
  }

  clear(): void {
    this.jobs.clear();
    this.queueOrder.length = 0;
  }
}
