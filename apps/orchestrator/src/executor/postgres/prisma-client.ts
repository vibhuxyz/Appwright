export type PrismaTaskStatus = "PENDING" | "READY" | "RUNNING" | "BLOCKED" | "FAILED" | "DONE";
export type PrismaRunStatus = "QUEUED" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED";
export type PrismaAttemptStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

export interface RunRow {
  sessionId: string;
  blueprintVersion: number;
  budgetUsd: number;
  totalCostUsd: number;
}

export interface TaskRow {
  id: string;
  title: string;
  status: PrismaTaskStatus;
  dependsOn: unknown;
  owns: unknown;
  attempts: { attemptNumber: number }[];
}

export interface AttemptWrite {
  status: PrismaAttemptStatus;
  model: string;
  costUsd: number;
  durationMs: number;
  commitSha: string | null;
  error: string | null;
}

export interface PrismaRunClient {
  run: {
    findUnique(args: {
      where: { id: string };
      select: { sessionId: true; blueprintVersion: true; budgetUsd: true; totalCostUsd: true };
    }): Promise<RunRow | null>;
    update(args: {
      where: { id: string };
      data: {
        status?: PrismaRunStatus;
        startedAt?: Date;
        completedAt?: Date;
        error?: string | null;
        totalCostUsd?: { increment: number };
      };
    }): Promise<unknown>;
  };
  blueprint: {
    findUnique(args: {
      where: { sessionId_blueprintVersion: { sessionId: string; blueprintVersion: number } };
      select: {
        tasks: {
          orderBy: { id: "asc" };
          select: {
            id: true;
            title: true;
            status: true;
            dependsOn: true;
            owns: true;
            attempts: { select: { attemptNumber: true } };
          };
        };
      };
    }): Promise<{ tasks: TaskRow[] } | null>;
  };
  task: {
    update(args: { where: { id: string }; data: { status: PrismaTaskStatus } }): Promise<unknown>;
  };
  taskAttempt: {
    upsert(args: {
      where: { taskId_attemptNumber: { taskId: string; attemptNumber: number } };
      create: AttemptWrite & { taskId: string; runId: string; attemptNumber: number };
      update: AttemptWrite;
    }): Promise<unknown>;
  };
}
