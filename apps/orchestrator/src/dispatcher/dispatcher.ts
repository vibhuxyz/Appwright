import { LeaseManager } from "../lease";
import { MemoryQueue } from "../queue";
import { transitionJob, type JobRecord } from "../state-machine";
import type { DispatcherOptions, WorkerHandler } from "./types";

export class Dispatcher {
  private readonly queue: MemoryQueue;
  private readonly leaseManager: LeaseManager;
  private readonly workerId: string;
  private readonly pollIntervalMs: number;
  private readonly leaseDurationMs: number;
  private isRunning = false;
  private pollTimer?: ReturnType<typeof setTimeout>;

  constructor(
    queue: MemoryQueue,
    leaseManager: LeaseManager,
    opts?: DispatcherOptions,
  ) {
    this.queue = queue;
    this.leaseManager = leaseManager;
    this.workerId =
      opts?.workerId ?? `worker-${Math.random().toString(36).slice(2, 8)}`;
    this.pollIntervalMs = opts?.pollIntervalMs ?? 50;
    this.leaseDurationMs = opts?.leaseDurationMs ?? 5000;
  }

  start(handler: WorkerHandler): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleTick(handler);
  }

  stop(): void {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  private scheduleTick(handler: WorkerHandler): void {
    if (!this.isRunning) return;
    this.pollTimer = setTimeout(async () => {
      try {
        await this.tick(handler);
      } finally {
        if (this.isRunning) {
          this.scheduleTick(handler);
        }
      }
    }, this.pollIntervalMs);
  }

  async tick(handler: WorkerHandler): Promise<void> {
    const expired = this.leaseManager.getExpiredLeases();
    for (const lease of expired) {
      this.leaseManager.releaseLease(lease.jobId, lease.workerId);
      this.queue.requeue(lease.jobId, "Worker lease expired");
    }

    const job = this.queue.claim(this.workerId);
    if (!job) return;

    this.leaseManager.acquireLease(
      job.id,
      this.workerId,
      this.leaseDurationMs,
    );

    const heartbeat = () => {
      this.leaseManager.renewLease(
        job.id,
        this.workerId,
        this.leaseDurationMs,
      );
    };

    try {
      this.queue.updateStatus(job.id, (rec) => ({
        ...rec,
        status: transitionJob(rec.status, { type: "SANDBOX_READY" }),
        updatedAt: Date.now(),
      }));

      await handler(job, heartbeat);

      this.queue.updateStatus(job.id, (rec) => ({
        ...rec,
        status: transitionJob(rec.status, { type: "START_VERIFY" }),
        updatedAt: Date.now(),
      }));

      this.queue.updateStatus(job.id, (rec) => ({
        ...rec,
        status: transitionJob(rec.status, { type: "ALL_GREEN" }),
        updatedAt: Date.now(),
      }));
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.queue.requeue(job.id, reason);
    } finally {
      this.leaseManager.releaseLease(job.id, this.workerId);
    }
  }
}
