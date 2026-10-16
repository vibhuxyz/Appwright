import type { Lease, LeaseManagerOptions } from "./types";

export class LeaseManager {
  private readonly leases = new Map<string, Lease>();
  private readonly defaultDurationMs: number;

  constructor(opts?: LeaseManagerOptions) {
    this.defaultDurationMs = opts?.defaultLeaseDurationMs ?? 15_000;
  }

  acquireLease(jobId: string, workerId: string, durationMs?: number): Lease {
    const now = Date.now();
    const expiresAt = now + (durationMs ?? this.defaultDurationMs);
    const lease: Lease = {
      jobId,
      workerId,
      acquiredAt: now,
      expiresAt,
      heartbeatCount: 0,
    };
    this.leases.set(jobId, lease);
    return lease;
  }

  renewLease(jobId: string, workerId: string, extensionMs?: number): Lease {
    const current = this.leases.get(jobId);
    if (!current) {
      throw new Error(`Cannot renew non-existent lease for job: ${jobId}`);
    }
    if (current.workerId !== workerId) {
      throw new Error(`Worker ${workerId} does not own lease for job: ${jobId}`);
    }

    const now = Date.now();
    const updated: Lease = {
      ...current,
      expiresAt: now + (extensionMs ?? this.defaultDurationMs),
      heartbeatCount: current.heartbeatCount + 1,
    };
    this.leases.set(jobId, updated);
    return updated;
  }

  releaseLease(jobId: string, workerId: string): void {
    const current = this.leases.get(jobId);
    if (current && current.workerId === workerId) {
      this.leases.delete(jobId);
    }
  }

  isLeaseActive(jobId: string, now: number = Date.now()): boolean {
    const current = this.leases.get(jobId);
    if (!current) return false;
    return current.expiresAt > now;
  }

  getExpiredLeases(now: number = Date.now()): Lease[] {
    const expired: Lease[] = [];
    for (const lease of this.leases.values()) {
      if (lease.expiresAt <= now) {
        expired.push(lease);
      }
    }
    return expired;
  }

  clear(): void {
    this.leases.clear();
  }
}
