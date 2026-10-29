import {
  OpenAiProvider,
  analyzeMultimodalPrompt,
  plannerModel,
  type Runtime,
} from "@repo/agent-core";
import { createAssetRequest } from "@repo/assets";
import {
  creditsToCents,
  creditsToUsd,
  type Attachment,
  type PlanId,
  type ProjectSpecification,
  type ThemeOption,
} from "@repo/contracts";
import {
  buildBlueprint,
  codingProfileFor,
  delegatedStatus,
  executeBlueprintRun,
  isSinglePassBlueprint,
  loadApprovedBlueprint,
  persistBlueprint,
  startBlueprintRun,
  type ApprovedBlueprint,
} from "@repo/blueprint";
import { publishChannel, sessionChannel, type SseAssetRequestFrame } from "@repo/cache";
import { formatSpecificationSummary } from "./format-spec-summary";
import { createEmitAdapter } from "./emit-adapter";
import { prepareBuildEnvironment } from "./integrations";
import { createTaskInteractiveTools } from "./interactive-tools";
import { publishStatus } from "./persist";
import type { PersistFields } from "./persist";
import { waitForSectionImages } from "./section-images";
import { prepareSinglePassBrief, singlePassPlanMessage } from "./single-pass";

const RUN_OUTCOME_TO_STOP_REASON = {
  completed: "completed",
  partial: "fatalError",
  cancelled: "cancelled",
  budget_exhausted: "budgetExceeded",
} as const;

export type BlueprintPathOutcome =
  | { kind: "ran"; stopReason: string }
  | { kind: "single-pass"; brief: string };

export interface RunBlueprintPathOptions {
  prompt: string;
  attachments?: readonly Attachment[];
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
  isAutoImageChoice: boolean;
  answers?: Readonly<Record<string, string>>;
}

type FreshPlanOptions = Pick<
  RunBlueprintPathOptions,
  "sessionId" | "prompt" | "theme" | "userPlan" | "attachments" | "persist" | "answers"
>;

function delegatedEntries(labelByTitle: ReadonlyMap<string, string>): { title: string; label: string }[] {
  return [...labelByTitle.entries()].map(([title, label]) => ({ title, label }));
}

async function approvedPlan(blueprintId: string, theme: ThemeOption | undefined): Promise<ApprovedBlueprint> {
  const approved = await loadApprovedBlueprint(blueprintId, theme);
  if (!approved) throw new Error(`Could not load the approved plan ${blueprintId}`);
  return approved;
}

async function freshPlan(options: FreshPlanOptions): Promise<ApprovedBlueprint> {
  const { sessionId, prompt, theme, userPlan, attachments, persist } = options;
  let specification: ProjectSpecification | undefined;
  if (attachments && attachments.length > 0) {
    publishStatus(sessionId, "RUNNING", "Analyzing request and reference attachments…");
    const analysis = await analyzeMultimodalPrompt({
      prompt,
      attachments,
      model: plannerModel(userPlan),
    });
    if (analysis.ok) {
      specification = analysis.specification;
      if (persist) {
        await persist({
          role: "assistant",
          type: "text",
          content: formatSpecificationSummary(specification),
        });
      }
    }
  }

  const plan = await buildBlueprint(prompt, {
    theme,
    specification,
    answers: options.answers,
    provider: new OpenAiProvider({ model: plannerModel(userPlan) }),
  });
  return { plan, persisted: await persistBlueprint(sessionId, plan, { specification }) };
}

function planMessage(approved: ApprovedBlueprint, isSinglePass: boolean): string {
  if (isSinglePass) return singlePassPlanMessage(approved.plan.blueprint.pages.map((page) => page.route));
  return `Plan:\n${approved.persisted.tasks.map((task, i) => `${i + 1}. ${task.title}`).join("\n")}`;
}

async function runPlannedTasks(options: RunBlueprintPathOptions, approved: ApprovedBlueprint): Promise<string> {
  const { sessionId, worktreeSessionId, projectId, model, credits, userId, userPlan, runtime, signal, persist } = options;
  const runId = await startBlueprintRun({
    sessionId,
    blueprintVersion: approved.persisted.blueprintVersion,
    budgetUsd: creditsToUsd(credits),
  });
  publishStatus(sessionId, "RUNNING", "Plan formulated. Building tasks…");

  const titleById = new Map(approved.persisted.tasks.map((task) => [task.id, task.title]));
  const typeById = new Map(approved.persisted.tasks.map((task) => [task.id, task.type]));
  const reportedTasks = new Set<string>();
  const labelByTitle = new Map<string, string>();
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
      extraTools: createTaskInteractiveTools({ projectId, sessionId, worktreeSessionId, signal, persist }),
      onTaskStatus: (taskId, status) => {
        const title = titleById.get(taskId) ?? taskId;
        const label = codingProfileFor(typeById.get(taskId) ?? "").label;
        if (status === "running") labelByTitle.set(title, label);
        if (status === "done" || status === "failed") labelByTitle.delete(title);
        if (status === "running" || status === "done" || status === "failed") {
          publishStatus(sessionId, "RUNNING", delegatedStatus(delegatedEntries(labelByTitle)));
        }
        if (status === "running") return;
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

export async function runBlueprintPath(options: RunBlueprintPathOptions): Promise<BlueprintPathOutcome> {
  const { prompt, projectId, sessionId, worktreeSessionId, userId, userPlan, theme, runtime, signal, persist } = options;

  const approved = options.approvedBlueprintId
    ? await approvedPlan(options.approvedBlueprintId, theme)
    : await freshPlan(options);
  const { plan, persisted } = approved;
  const preparation = await prepareBuildEnvironment({
    projectId,
    sessionId,
    worktreeSessionId,
    userId,
    needsDatabase: plan.blueprint.stack.db === "mongodb",
    runtime,
    signal,
    persist,
  });
  if (preparation === "cancelled") return { kind: "ran", stopReason: "cancelled" };

  const isSinglePass = isSinglePassBlueprint(plan.blueprint);
  const assetRequest = await createAssetRequest(sessionId, projectId, persisted.blueprintId, plan.blueprint);
  if (assetRequest) {
    const frame: SseAssetRequestFrame = { kind: "assetRequest", assetRequest };
    await publishChannel(sessionChannel(sessionId), frame);
  }

  await persist({ role: "assistant", type: "text", content: planMessage(approved, isSinglePass) });

  const images = await waitForSectionImages({
    sessionId,
    assetRequest,
    signal,
    persist,
    isAutoChoice: options.isAutoImageChoice,
  });
  if (images === "cancelled") return { kind: "ran", stopReason: "cancelled" };

  if (isSinglePass) {
    publishStatus(sessionId, "RUNNING", "Plan formulated. Building the site in one pass…");
    return { kind: "single-pass", brief: await prepareSinglePassBrief(sessionId, projectId, plan.blueprint, runtime) };
  }
  return { kind: "ran", stopReason: await runPlannedTasks(options, approved) };
}
