import type { JobRecord } from "../state-machine";

export interface JobPayload {
  jobId: string;
  sessionId: string;
  projectId: string;
  prompt: string;
  maxRetries?: number;
}

export interface QueueOptions {
  maxConcurrency?: number;
  defaultMaxRetries?: number;
}

export interface QueueStats {
  queued: number;
  running: number;
  succeeded: number;
  failed: number;
  cancelled: number;
}
