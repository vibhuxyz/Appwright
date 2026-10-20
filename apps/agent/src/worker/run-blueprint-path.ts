import type { Runtime } from "@repo/agent-core";
import { createAssetRequest } from "@repo/assets";
import {
  buildBlueprint,
  executeBlueprintRun,
  persistBlueprint,
  startBlueprintRun,
} from "@repo/blueprint";
import { publishChannel, sessionChannel, type SseAssetRequestFrame } from "@repo/cache";
import { publishStatus } from "./persist";
import type { PersistFields } from "./persist";

const RUN_OUTCOME_TO_STOP_REASON = {
  completed: "completed",
  partial: "fatalError",
  cancelled: "cancelled",
  budget_exhausted: "budgetExceeded",
} as const;

export interface RunBlueprintPathOptions {
  prompt: string;
  projectId: string;
  sessionId: string;
  model: string;
  runtime: Runtime;
  signal: AbortSignal;
  persist: (fields: PersistFields) => Promise<unknown>;
}

const UNLIMITED_BUDGET_CENTS = Number.POSITIVE_INFINITY;

export async function runBlueprintPath(options: RunBlueprintPathOptions): Promise<string> {
  const { prompt, projectId, sessionId, model, runtime, signal, persist } = options;

  const plan = await buildBlueprint(prompt);
  const persisted = await persistBlueprint(sessionId, plan);
  const runId = await startBlueprintRun(sessionId, persisted.blueprintVersion);

  const assetRequest = await createAssetRequest(sessionId, persisted.blueprintId, plan.blueprint);
  if (assetRequest) {
    const frame: SseAssetRequestFrame = { kind: "assetRequest", assetRequest };
    await publishChannel(sessionChannel(sessionId), frame);
  }

  await persist({
    role: "assistant",
    type: "text",
    content: `Plan:\n${persisted.tasks.map((task, i) => `${i + 1}. ${task.title}`).join("\n")}`,
  });
  publishStatus(sessionId, "RUNNING", "Plan formulated. Building tasks…");

  const titleById = new Map(persisted.tasks.map((task) => [task.id, task.title]));
  const reportedTasks = new Set<string>();

  const summary = await executeBlueprintRun(
    {
      runId,
      sessionId,
      projectId,
      model,
      userRemainingCents: UNLIMITED_BUDGET_CENTS,
      runtime,
      onTaskStatus: (taskId, status) => {
        const title = titleById.get(taskId) ?? taskId;
        if (status === "running") {
          publishStatus(sessionId, "RUNNING", `Building: ${title}`);
          return;
        }
        if ((status === "done" || status === "failed") && !reportedTasks.has(taskId)) {
          reportedTasks.add(taskId);
          void persist({
            role: "assistant",
            type: "text",
            content: status === "done" ? `✅ ${title}` : `❌ ${title}`,
          });
        }
      },
    },
    signal,
  );

  if (!summary) return "fatalError";
  return RUN_OUTCOME_TO_STOP_REASON[summary.outcome];
}
