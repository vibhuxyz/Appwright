import {
  OpenAiProvider,
  bestModelsForPlan,
  buildSystemPrompt,
  runAgentLoop,
  scaleBudget,
  type AgentEventSink,
  type Budget,
  type Message,
  type Provider,
  type Runtime,
  type StopReason,
  type Tool,
} from "@repo/agent-core";
import { AGENT_LOOP_LIMITS, type EffortLevel, type PlanId, type TaskType } from "@repo/contracts";
import { createLogger } from "@repo/logger";
import { ALL_TOOLS, guardTools } from "@repo/tools";
import type { FencedAttemptInput, GeneratedAttempt, TaskGenerator } from "orchestrator";
import { isUiTaskType, loadDesignSkills } from "./art-direction";
import { codingModelFor, codingProfileFor, withCodingBrief } from "./coding-agent";
import { buildTaskPrompt } from "./build-task-prompt";
import { buildRetryPrompt, isVerificationFailure } from "./retry-prompt";
import { generateAdminCrudAttempt } from "./generate-admin-crud-attempt";
import { generateDataModelAttempt } from "./generate-data-model-attempt";
import { generateDeployAttempt } from "./generate-deploy-attempt";
import { generatePaymentAttempt } from "./generate-payment-attempt";
import { generatePublicApiAttempt } from "./generate-public-api-attempt";
import { generateSeedAttempt } from "./generate-seed-attempt";
import { generateSeoAttempt } from "./generate-seo-attempt";
import { generateThemeAttempt } from "./generate-theme-attempt";
import { loadTaskDetail, type TaskDetail } from "./load-task-detail";
import { taskTypeFromPrisma } from "./map-task-row";
import { deliverPatterns } from "./patterns";

const DETERMINISTIC_GENERATORS: Partial<
  Record<TaskType, (task: TaskDetail, runtime: Runtime) => Promise<GeneratedAttempt>>
> = {
  schema: generateDataModelAttempt,
  admin: generateAdminCrudAttempt,
  seo: generateSeoAttempt,
  deploy: generateDeployAttempt,
  theme: generateThemeAttempt,
  api: generatePublicApiAttempt,
  seed: generateSeedAttempt,
  payment: generatePaymentAttempt,
};

const log = createLogger("blueprint");
const CENTS_PER_USD = 100;
const WRITE_TOOL_NAMES = new Set(["write_file", "edit_file"]);
const EMPTY_SKILLS = { text: "", included: [] as string[], cut: [] as string[] };

export interface RunTaskGeneratorOptions {
  sessionId: string;
  model: string;
  plan: PlanId;
  runtime: Runtime;
  conversationEmit?: AgentEventSink;
  loadDetail?: (taskId: string) => Promise<TaskDetail>;
  providers?: readonly Provider[];
  extraTools?: readonly Tool[];
  complexity?: number;
  confidence?: number;
  intent?: string;
  effort?: EffortLevel;
}

async function withPatterns(task: TaskDetail, runtime: Runtime): Promise<string[]> {
  const before = await runtime.listDir(".");
  const delivery = await deliverPatterns(task, runtime, before);
  if (delivery.written.length === 0 && delivery.skipped.length === 0) return before;
  log.info("patterns delivered", { task: task.title, written: delivery.written, skipped: delivery.skipped });
  return delivery.written.length > 0 ? runtime.listDir(".") : before;
}

function providerChain(model: string, plan: PlanId): Provider[] {
  const models = [model, ...bestModelsForPlan(plan).filter((id) => id !== model)];
  return models.map((id) => new OpenAiProvider({ model: id }));
}

function pathFromToolArgs(args: Record<string, unknown>): string | undefined {
  return typeof args.path === "string" ? args.path : undefined;
}

function codingRoute(options: RunTaskGeneratorOptions) {
  return {
    plan: options.plan,
    ...(options.complexity !== undefined ? { complexity: options.complexity } : {}),
    ...(options.confidence !== undefined ? { confidence: options.confidence } : {}),
    ...(options.intent !== undefined ? { intent: options.intent } : {}),
    ...(options.effort !== undefined ? { effort: options.effort } : {}),
  };
}

function taskBudget(nowMs: number, effort?: EffortLevel): Budget {
  const scaled = scaleBudget(
    {
      maxCostUsd: AGENT_LOOP_LIMITS.maxTaskCostUsd,
      maxIterations: AGENT_LOOP_LIMITS.maxTaskIterations,
    },
    effort,
  );
  return {
    maxIterations: scaled.maxIterations,
    maxTokens: AGENT_LOOP_LIMITS.maxTokens,
    maxCostUsd: scaled.maxCostUsd,
    deadline: nowMs + AGENT_LOOP_LIMITS.taskDeadlineMs,
  };
}

interface AttemptTotals {
  costUsd: number;
  writtenPaths: string[];
  lastError: string;
}

function trackAttempt(conversationEmit: AgentEventSink | undefined): { emit: AgentEventSink; totals: AttemptTotals } {
  const totals: AttemptTotals = { costUsd: 0, writtenPaths: [], lastError: "" };
  const emit: AgentEventSink = (event) => {
    if (event.type === "usage") totals.costUsd += event.costUsd;
    if (event.type === "error") totals.lastError = event.message;
    if (event.type === "tool_call_start" && WRITE_TOOL_NAMES.has(event.toolName)) {
      const path = pathFromToolArgs(event.args);
      if (path) totals.writtenPaths.push(path);
    }
    return conversationEmit?.(event);
  };
  return { emit, totals };
}

function finishAttempt(stopReason: StopReason, totals: AttemptTotals): GeneratedAttempt {
  const costCents = Math.round(totals.costUsd * CENTS_PER_USD);
  if (stopReason === "completed") return { kind: "completed", costCents, writtenPaths: totals.writtenPaths };
  if (stopReason === "budgetExceeded") return { kind: "budgetExceeded", costCents };
  return { kind: "failed", costCents, error: totals.lastError || `Agent stopped: ${stopReason}` };
}

async function taskMessages(task: TaskDetail, runtime: Runtime, previousError: string | undefined): Promise<Message[]> {
  const includeDesign = previousError !== undefined && !isVerificationFailure(previousError);
  const [, skills] = await Promise.all([
    withPatterns(task, runtime),
    includeDesign ? loadDesignSkills(task, previousError) : Promise.resolve(EMPTY_SKILLS),
  ]);
  if (skills.included.length > 0) log.info("design skills", { task: task.title, included: skills.included, cut: skills.cut });
  const systemPrompt = await buildSystemPrompt(runtime, {
    includeFileTree: false,
    includeReference: includeDesign,
    includeUiPrimitives: isUiTaskType(task.type),
  });
  const brief = codingProfileFor(task.type).brief;
  const taskPrompt = isVerificationFailure(previousError)
    ? buildRetryPrompt(task, previousError)
    : buildTaskPrompt(task, previousError, {
        includeDesign,
        ...(skills.text ? { skills: skills.text } : {}),
      });
  return [
    { role: "user", type: "text", content: systemPrompt },
    { role: "user", type: "text", content: withCodingBrief(brief, taskPrompt) },
  ];
}

export function createRunTaskGenerator(options: RunTaskGeneratorOptions): TaskGenerator {
  const { sessionId, model, plan, runtime, conversationEmit, loadDetail = loadTaskDetail } = options;

  return {
    async generate(input: FencedAttemptInput): Promise<GeneratedAttempt> {
      const task = await loadDetail(input.task.id);
      const profile = codingProfileFor(task.type);
      const chosenModel = codingModelFor(profile, model, process.env, codingRoute(options));
      log.info("coding agent", {
        sessionId,
        taskId: input.task.id,
        type: task.type,
        agent: profile.label,
        model: chosenModel,
        sessionModel: model,
      });
      const deterministicGenerator = DETERMINISTIC_GENERATORS[taskTypeFromPrisma(task.type)];
      if (deterministicGenerator) return deterministicGenerator(task, runtime);

      const { emit, totals } = trackAttempt(conversationEmit);
      const [primary, ...fallback] = options.providers ?? providerChain(chosenModel, plan);
      const guard = guardTools([...ALL_TOOLS, ...(options.extraTools ?? [])]);
      const stopReason = await runAgentLoop({
        messages: await taskMessages(task, runtime, input.previousError),
        tools: guard.tools,
        provider: primary ?? new OpenAiProvider({ model: chosenModel }),
        fallbackProviders: fallback,
        runtime,
        emit,
        budget: taskBudget(Date.now(), options.effort),
        signal: input.signal,
        sessionId,
      });
      log.info("run guard stats", { sessionId, taskId: input.task.id, ...guard.stats() });
      return finishAttempt(stopReason, totals);
    },
  };
}
