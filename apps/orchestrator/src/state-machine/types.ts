export type JobStatus =
  | "queued"
  | "provisioning"
  | "running"
  | "awaiting_approval"
  | "verifying"
  | "succeeded"
  | "failed"
  | "cancelled";

export type JobEventType =
  | "CLAIM"
  | "SANDBOX_READY"
  | "PROVISION_FAILED"
  | "REQUIRE_APPROVAL"
  | "APPROVAL_RESOLVED"
  | "START_VERIFY"
  | "TASK_CONTINUE"
  | "ALL_GREEN"
  | "WORKER_DIED"
  | "UNRECOVERABLE_ERROR"
  | "CANCEL";

export interface JobEvent {
  type: JobEventType;
  reason?: string;
}

export interface JobRecord {
  id: string;
  sessionId: string;
  projectId: string;
  status: JobStatus;
  retryCount: number;
  maxRetries: number;
  workerId?: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
}
