import {
  OpenAiProvider,
  bestModelsForPlan,
  type Provider,
  loadStackStandards,
  runAgentLoop,
  type AgentEventSink,
  type Runtime,
  type Tool,
} from "@repo/agent-core";
import { AGENT_LOOP_LIMITS, type PlanId, type TaskType } from "@repo/contracts";
import { createLogger } from "@repo/logger";
import { ALL_TOOLS, guardTools } from "@repo/tools";
import type { FencedAttemptInput, GeneratedAttempt, TaskGenerator } from "orchestrator";
import { loadDesignSkills } from "./art-direction";
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

export interface RunTaskGeneratorOptions {
  sessionId: string;
  model: string;
  plan: PlanId;
  runtime: Runtime;
  conversationEmit?: AgentEventSink;
  loadDetail?: (taskId: string) => Promise<TaskDetail>;
  providers?: readonly Provider[];
  extraTools?: readonly Tool[];
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

export function createRunTaskGenerator(options: RunTaskGeneratorOptions): TaskGenerator {
  const { sessionId, model, plan, runtime, conversationEmit, loadDetail = loadTaskDetail } = options;

  return {
    async generate(input: FencedAttemptInput): Promise<GeneratedAttempt> {
      const task = await loadDetail(input.task.id);
      const deterministicGenerator = DETERMINISTIC_GENERATORS[taskTypeFromPrisma(task.type)];
      if (deterministicGenerator) {
        return deterministicGenerator(task, runtime);
      }

      const [standards, projectTree, skills] = await Promise.all([
        loadStackStandards(),
        withPatterns(task, runtime),
        loadDesignSkills(task, input.previousError),
      ]);
      if (skills.included.length > 0) log.info("design skills", { task: task.title, included: skills.included, cut: skills.cut });
      const writtenPaths: string[] = [];
      let costUsd = 0;

      const emit: AgentEventSink = (event) => {
        if (event.type === "usage") costUsd += event.costUsd;
        if (event.type === "tool_call_start" && WRITE_TOOL_NAMES.has(event.toolName)) {
          const path = pathFromToolArgs(event.args);
          if (path) writtenPaths.push(path);
        }
        return conversationEmit?.(event);
      };

      let lastError = "";
      const [primary, ...fallback] = options.providers ?? providerChain(model, plan);
      const guard = guardTools([...ALL_TOOLS, ...(options.extraTools ?? [])]);
      const stopReason = await runAgentLoop({
        messages: [
          {
            role: "user",
            type: "text",
            content: isVerificationFailure(input.previousError)
              ? buildRetryPrompt(task, input.previousError)
              : buildTaskPrompt(task, input.previousError, { standards, projectTree, skills: skills.text }),
          },
        ],
        tools: guard.tools,
        provider: primary ?? new OpenAiProvider({ model }),
        fallbackProviders: fallback,
        runtime,
        emit: (event) => {
          if (event.type === "error") lastError = event.message;
          return emit(event);
        },
        budget: {
          maxIterations: AGENT_LOOP_LIMITS.maxTaskIterations,
          maxTokens: AGENT_LOOP_LIMITS.maxTokens,
          maxCostUsd: AGENT_LOOP_LIMITS.maxTaskCostUsd,
          deadline: Date.now() + AGENT_LOOP_LIMITS.taskDeadlineMs,
        },
        signal: input.signal,
        sessionId,
      });
      log.info("run guard stats", { sessionId, taskId: input.task.id, ...guard.stats() });

      const costCents = Math.round(costUsd * CENTS_PER_USD);
      if (stopReason === "completed") {
        return { kind: "completed", costCents, writtenPaths };
      }
      if (stopReason === "budgetExceeded") {
        return { kind: "budgetExceeded", costCents };
      }
      return {
        kind: "failed",
        costCents,
        error: lastError || `Agent stopped: ${stopReason}`,
      };
    },
  };
}
