import type { AttemptRecord, RunStore } from "orchestrator";

export class StubRunStore implements RunStore {
  readonly attempts: AttemptRecord[] = [];
  readonly statuses = new Map<string, string>();

  async loadRun(): Promise<undefined> {
    return undefined;
  }

  async startRun(): Promise<void> {}

  async setTaskStatus(taskId: string, status: string): Promise<void> {
    this.statuses.set(taskId, status);
  }

  async recordAttempt(_runId: string, record: AttemptRecord): Promise<void> {
    this.attempts.push(record);
  }

  async finishRun(): Promise<void> {}
}
