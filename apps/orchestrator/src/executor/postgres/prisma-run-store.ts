import { centsToUsd, toAttemptWrite, toExecutableTask, toPrismaRunStatus, toPrismaTaskStatus, usdToCents } from "./mappers";
import type { PrismaRunClient } from "./prisma-client";
import type { RunFinish, RunStore, StoredRun } from "./types";

export interface PrismaRunStoreConfig {
  client: PrismaRunClient;
  modelName: string;
  now(): number;
}

export function createPrismaRunStore(config: PrismaRunStoreConfig): RunStore {
  const { client, modelName, now } = config;

  async function loadRun(runId: string): Promise<StoredRun | undefined> {
    const run = await client.run.findUnique({
      where: { id: runId },
      select: { sessionId: true, blueprintVersion: true, budgetUsd: true, totalCostUsd: true },
    });
    if (!run) return undefined;
    const blueprint = await client.blueprint.findUnique({
      where: {
        sessionId_blueprintVersion: {
          sessionId: run.sessionId,
          blueprintVersion: run.blueprintVersion,
        },
      },
      select: {
        tasks: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            title: true,
            status: true,
            dependsOn: true,
            owns: true,
            attempts: { select: { attemptNumber: true } },
          },
        },
      },
    });
    if (!blueprint) return undefined;
    return {
      id: runId,
      budgetCents: usdToCents(run.budgetUsd),
      spentCents: usdToCents(run.totalCostUsd),
      tasks: blueprint.tasks.map(toExecutableTask),
    };
  }

  return {
    loadRun,
    async startRun(runId) {
      await client.run.update({
        where: { id: runId },
        data: { status: "RUNNING", startedAt: new Date(now()) },
      });
    },
    async setTaskStatus(taskId, status) {
      await client.task.update({
        where: { id: taskId },
        data: { status: toPrismaTaskStatus(status) },
      });
    },
    async recordAttempt(runId, record) {
      const write = toAttemptWrite(record, modelName);
      await client.taskAttempt.upsert({
        where: { taskId_attemptNumber: { taskId: record.taskId, attemptNumber: record.attemptNumber } },
        create: { ...write, taskId: record.taskId, runId, attemptNumber: record.attemptNumber },
        update: write,
      });
      await client.run.update({
        where: { id: runId },
        data: { totalCostUsd: { increment: centsToUsd(record.costCents) } },
      });
    },
    async finishRun(runId, finish: RunFinish) {
      await client.run.update({
        where: { id: runId },
        data: {
          status: toPrismaRunStatus(finish.status),
          completedAt: new Date(now()),
          error: finish.error ?? null,
        },
      });
    },
  };
}
