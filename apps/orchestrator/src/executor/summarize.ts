import type { WaitingTask } from "../scheduler";
import { idsWithStatus, type TaskState } from "./task-state";
import type { ExecutableTask, RunOutcome, RunSummary } from "./types";

interface SummaryInput {
  tasks: readonly ExecutableTask[];
  states: ReadonlyMap<string, TaskState>;
  waiting: WaitingTask[];
  spentCents: number;
  wasCancelled: boolean;
}

function outcomeFor(input: SummaryInput, unstarted: string[]): RunOutcome {
  if (input.wasCancelled) return "cancelled";
  if (unstarted.length === 0 && input.waiting.length === 0) {
    const allDone = input.tasks.every((task) => input.states.get(task.id)?.status === "done");
    if (allDone) return "completed";
  }
  const isBudgetStalled = input.waiting.some((entry) => entry.reason.kind === "budget");
  return isBudgetStalled ? "budget_exhausted" : "partial";
}

export function summarize(input: SummaryInput): RunSummary {
  const { tasks, states } = input;
  const unstarted = idsWithStatus(tasks, states, "pending");
  return {
    outcome: outcomeFor(input, unstarted),
    done: idsWithStatus(tasks, states, "done"),
    failed: idsWithStatus(tasks, states, "failed"),
    blocked: idsWithStatus(tasks, states, "blocked"),
    unstarted,
    spentCents: input.spentCents,
    waiting: input.waiting,
  };
}
