import type { TaskStatus } from "@repo/contracts";
import { z } from "zod";
import type { AttemptRecord, ExecutableTask } from "../types";
import type {
  AttemptWrite,
  PrismaAttemptStatus,
  PrismaRunStatus,
  PrismaTaskStatus,
  TaskRow,
} from "./prisma-client";
import type { RunFinalStatus } from "./types";

const CENTS_PER_USD = 100;
const CANCELLED_ERROR = "Attempt cancelled";

const StringList = z.array(z.string());

export function centsToUsd(cents: number): number {
  return cents / CENTS_PER_USD;
}

export function usdToCents(usd: number): number {
  return Math.round(usd * CENTS_PER_USD);
}

export function toPrismaTaskStatus(status: TaskStatus): PrismaTaskStatus {
  switch (status) {
    case "pending": return "PENDING";
    case "ready": return "READY";
    case "running": return "RUNNING";
    case "blocked": return "BLOCKED";
    case "failed": return "FAILED";
    case "done": return "DONE";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function fromPrismaTaskStatus(status: PrismaTaskStatus): TaskStatus {
  switch (status) {
    case "PENDING": return "pending";
    case "READY": return "ready";
    case "RUNNING": return "running";
    case "BLOCKED": return "blocked";
    case "FAILED": return "failed";
    case "DONE": return "done";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function toPrismaRunStatus(status: RunFinalStatus): PrismaRunStatus {
  switch (status) {
    case "completed": return "COMPLETED";
    case "failed": return "FAILED";
    case "cancelled": return "CANCELLED";
    case "paused": return "PAUSED";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

function toPrismaAttemptStatus(status: AttemptRecord["status"]): PrismaAttemptStatus {
  return status === "succeeded" ? "SUCCEEDED" : "FAILED";
}

export function toAttemptWrite(record: AttemptRecord, model: string): AttemptWrite {
  return {
    status: toPrismaAttemptStatus(record.status),
    model,
    costUsd: centsToUsd(record.costCents),
    durationMs: record.durationMs,
    commitSha: record.commitSha ?? null,
    error: record.status === "cancelled" ? CANCELLED_ERROR : (record.error ?? null),
  };
}

export function toExecutableTask(row: TaskRow): ExecutableTask {
  const dependsOn = StringList.safeParse(row.dependsOn);
  const owns = StringList.safeParse(row.owns);
  if (!dependsOn.success || !owns.success) {
    throw new Error(`Task ${row.id} has malformed dependsOn or owns in the database`);
  }
  return {
    id: row.id,
    title: row.title,
    status: fromPrismaTaskStatus(row.status),
    dependsOn: dependsOn.data,
    owns: owns.data,
    attemptsMade: Math.max(0, ...row.attempts.map((attempt) => attempt.attemptNumber)),
  };
}
