import {
  OpenAiProvider,
  bestModelsForPlan,
  loadStackStandards,
  runAgentLoop,
  type AgentEventSink,
  type Runtime,
} from "@repo/agent-core";
import { AGENT_LOOP_LIMITS, type PlanId, type TaskType } from "@repo/contracts";
import { ALL_TOOLS } from "@repo/tools";
import type { FencedAttemptInput, GeneratedAttempt, TaskGenerator } from "orchestrator";
import { buildTaskPrompt } from "./build-task-prompt";
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

const CENTS_PER_USD = 100;
const WRITE_TOOL_NAMES = new Set(["write_file", "edit_file"]);

export interface RunTaskGeneratorOptions {
  sessionId: string;
  model: string;
  plan: PlanId;
  runtime: Runtime;
}

function pathFromToolArgs(args: Record<string, unknown>): string | undefined {
  return typeof args.path === "string" ? args.path : undefined;
}

export function createRunTaskGenerator(options: RunTaskGeneratorOptions): TaskGenerator {
  const { sessionId, model, plan, runtime } = options;

  return {
    async generate(input: FencedAttemptInput): Promise<GeneratedAttempt> {
      const task = await loadTaskDetail(input.task.id);
      const deterministicGenerator = DETERMINISTIC_GENERATORS[taskTypeFromPrisma(task.type)];
      if (deterministicGenerator) {
        return deterministicGenerator(task, runtime);
      }

      const standards = await loadStackStandards();
      const writtenPaths: string[] = [];
      let costUsd = 0;

      const emit: AgentEventSink = (event) => {
        if (event.type === "usage") costUsd += event.costUsd;
        if (event.type === "tool_call_start" && WRITE_TOOL_NAMES.has(event.toolName)) {
          const path = pathFromToolArgs(event.args);
          if (path) writtenPaths.push(path);
        }
      };

      let lastError = "";
      const models = [model, ...bestModelsForPlan(plan).filter((id) => id !== model)];
      const [primary, ...fallback] = models.map((id) => new OpenAiProvider({ model: id }));
      const stopReason = await runAgentLoop({
        messages: [
          { role: "user", type: "text", content: buildTaskPrompt(task, input.previousError, standards) },
        ],
        tools: ALL_TOOLS,
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
