import { OpenAiProvider, plannerModel, type Runtime } from "@repo/agent-core";
import { createAssetRequest, waitUntilAssetRequestResolved } from "@repo/assets";
import { creditsToCents, creditsToUsd, type PlanId, type ThemeOption } from "@repo/contracts";
import {
  buildBlueprint,
  executeBlueprintRun,
  loadApprovedBlueprint,
  persistBlueprint,
  startBlueprintRun,
  type ApprovedBlueprint,
} from "@repo/blueprint";
import { publishChannel, sessionChannel, type SseAssetRequestFrame } from "@repo/cache";
import { provisionProjectDatabase } from "@repo/db";
import { injectProjectRuntimeEnv } from "./inject-project-env";
import { createEmitAdapter } from "./emit-adapter";
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
  worktreeSessionId: string;
  model: string;
  credits: number;
  userId: string;
  userPlan: PlanId;
  theme?: ThemeOption;
  runtime: Runtime;
  signal: AbortSignal;
  persist: (fields: PersistFields) => Promise<unknown>;
  approvedBlueprintId?: string;
}

function runningTasksStatus(titles: ReadonlySet<string>): string {
  if (titles.size === 0) return "Building…";
  return `Building: ${[...titles].join(", ")}`;
}

async function approvedPlan(blueprintId: string, theme: ThemeOption | undefined): Promise<ApprovedBlueprint> {
  const approved = await loadApprovedBlueprint(blueprintId, theme);
  if (!approved) throw new Error(`Could not load the approved plan ${blueprintId}`);
  return approved;
}

async function freshPlan(
  sessionId: string,
  prompt: string,
  theme: ThemeOption | undefined,
  userPlan: PlanId,
): Promise<ApprovedBlueprint> {
  const plan = await buildBlueprint(prompt, {
    theme,
    provider: new OpenAiProvider({ model: plannerModel(userPlan) }),
  });
  return { plan, persisted: await persistBlueprint(sessionId, plan) };
}

export async function runBlueprintPath(options: RunBlueprintPathOptions): Promise<string> {
  const {
    prompt,
    projectId,
    sessionId,
    worktreeSessionId,
    model,
    credits,
    userId,
    userPlan,
    theme,
    runtime,
    signal,
    persist,
  } = options;

  const { plan, persisted } = options.approvedBlueprintId
    ? await approvedPlan(options.approvedBlueprintId, theme)
    : await freshPlan(sessionId, prompt, theme, userPlan);
  if (plan.blueprint.stack.db === "mongodb") {
    await provisionProjectDatabase({
      projectId,
      environment: "development",
      actorUserId: userId,
    });
    await injectProjectRuntimeEnv({ projectId, worktreeSessionId, runtime });
  }

  const runId = await startBlueprintRun({
    sessionId,
    blueprintVersion: persisted.blueprintVersion,
    budgetUsd: creditsToUsd(credits),
  });

  const assetRequest = await createAssetRequest(sessionId, projectId, persisted.blueprintId, plan.blueprint);
  if (assetRequest) {
    const frame: SseAssetRequestFrame = { kind: "assetRequest", assetRequest };
    await publishChannel(sessionChannel(sessionId), frame);
  }

  await persist({
    role: "assistant",
    type: "text",
    content: `Plan:\n${persisted.tasks.map((task, i) => `${i + 1}. ${task.title}`).join("\n")}`,
  });

  if (assetRequest && assetRequest.status !== "RESOLVED") {
    await persist({
      role: "assistant",
      type: "text",
      content:
        "Choose an image for each section: upload your own, generate one, or decide for me and I will pick a matching photo for that section and this business.",
    });
    publishStatus(sessionId, "RUNNING", "Waiting for section images…");
    try {
      await waitUntilAssetRequestResolved(assetRequest.id, signal);
    } catch {
      if (signal.aborted) return "cancelled";
      throw new Error("Waiting for section images failed");
    }
  }

  publishStatus(sessionId, "RUNNING", "Plan formulated. Building tasks…");

  const titleById = new Map(persisted.tasks.map((task) => [task.id, task.title]));
  const reportedTasks = new Set<string>();
  const runningTitles = new Set<string>();

  const { emit: conversationEmit } = createEmitAdapter({ sessionId, userId, persist });

  const summary = await executeBlueprintRun(
    {
      runId,
      sessionId,
      worktreeSessionId,
      projectId,
      model,
      plan: userPlan,
      userRemainingCents: creditsToCents(credits),
      runtime,
      conversationEmit,
      onTaskStatus: (taskId, status) => {
        const title = titleById.get(taskId) ?? taskId;
        if (status === "running") {
          runningTitles.add(title);
          publishStatus(sessionId, "RUNNING", runningTasksStatus(runningTitles));
          return;
        }
        if (status === "done" || status === "failed") {
          runningTitles.delete(title);
          publishStatus(sessionId, "RUNNING", runningTasksStatus(runningTitles));
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
