import type { JobEvent, JobStatus } from "./types";

export class InvalidStateTransitionError extends Error {
  constructor(current: JobStatus, eventType: string) {
    super(`Cannot transition job from status '${current}' on event '${eventType}'`);
    this.name = "InvalidStateTransitionError";
  }
}

export function transitionJob(current: JobStatus, event: JobEvent): JobStatus {
  if (event.type === "CANCEL") {
    if (current === "succeeded" || current === "failed" || current === "cancelled") {
      throw new InvalidStateTransitionError(current, event.type);
    }
    return "cancelled";
  }

  switch (current) {
    case "queued":
      if (event.type === "CLAIM") return "provisioning";
      break;

    case "provisioning":
      if (event.type === "SANDBOX_READY") return "running";
      if (event.type === "PROVISION_FAILED") return "queued";
      if (event.type === "UNRECOVERABLE_ERROR") return "failed";
      break;

    case "running":
      if (event.type === "REQUIRE_APPROVAL") return "awaiting_approval";
      if (event.type === "START_VERIFY") return "verifying";
      if (event.type === "WORKER_DIED") return "queued";
      if (event.type === "UNRECOVERABLE_ERROR") return "failed";
      break;

    case "awaiting_approval":
      if (event.type === "APPROVAL_RESOLVED") return "running";
      if (event.type === "WORKER_DIED") return "queued";
      break;

    case "verifying":
      if (event.type === "TASK_CONTINUE") return "running";
      if (event.type === "ALL_GREEN") return "succeeded";
      if (event.type === "UNRECOVERABLE_ERROR") return "failed";
      if (event.type === "WORKER_DIED") return "queued";
      break;

    case "succeeded":
    case "failed":
    case "cancelled":
      throw new InvalidStateTransitionError(current, event.type);

    default: {
      const exhaustiveCheck: never = current;
      throw new Error(`Unhandled job state: ${exhaustiveCheck}`);
    }
  }

  throw new InvalidStateTransitionError(current, event.type);
}
