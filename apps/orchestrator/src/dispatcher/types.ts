import type { JobRecord } from "../state-machine";

export type WorkerHandler = (
  job: JobRecord,
  heartbeat: () => void,
) => Promise<void>;

export interface DispatcherOptions {
  workerId?: string;
  pollIntervalMs?: number;
  leaseDurationMs?: number;
  maxConcurrency?: number;
}
