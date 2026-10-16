export interface Lease {
  jobId: string;
  workerId: string;
  acquiredAt: number;
  expiresAt: number;
  heartbeatCount: number;
}

export interface LeaseManagerOptions {
  defaultLeaseDurationMs?: number;
}
