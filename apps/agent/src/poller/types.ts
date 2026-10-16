export interface PollerOptions {
  workerId?: string;
  pollIntervalMs?: number;
  leaseDurationMs?: number;
  maxConcurrency?: number;
}

export interface Poller {
  stop: () => void;
}
