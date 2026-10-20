import {
  OpenAiProvider,
  runAgentLoop,
  type AgentEventSink,
  type Runtime,
} from "@repo/agent-core";
import { ALL_TOOLS } from "@repo/tools";
import type { FencedAttemptInput, GeneratedAttempt, TaskGenerator } from "orchestrator";
import { buildTaskPrompt } from "./build-task-prompt";
import { loadTaskDetail } from "./load-task-detail";

const TASK_MAX_ITERATIONS = 25;
const TASK_MAX_TOKENS = 300_000;
const TASK_MAX_COST_USD = 2;
const TASK_DEADLINE_MS = 5 * 60_000;
const CENTS_PER_USD = 100;
const WRITE_TOOL_NAMES = new Set(["write_file", "edit_file"]);

export interface RunTaskGeneratorOptions {
  sessionId: string;
  model: string;
  runtime: Runtime;
}

function pathFromToolArgs(args: Record<string, unknown>): string | undefined {
  return typeof args.path === "string" ? args.path : undefined;
}

export function createRunTaskGenerator(options: RunTaskGeneratorOptions): TaskGenerator {
  const { sessionId, model, runtime } = options;

  return {
    async generate(input: FencedAttemptInput): Promise<GeneratedAttempt> {
      const task = await loadTaskDetail(input.task.id);
      const writtenPaths: string[] = [];
      let costUsd = 0;

      const emit: AgentEventSink = (event) => {
        if (event.type === "usage") costUsd += event.costUsd;
        if (event.type === "tool_call_start" && WRITE_TOOL_NAMES.has(event.toolName)) {
          const path = pathFromToolArgs(event.args);
          if (path) writtenPaths.push(path);
        }
      };

      const stopReason = await runAgentLoop({
        messages: [{ role: "user", type: "text", content: buildTaskPrompt(task, input.previousError) }],
        tools: ALL_TOOLS,
        provider: new OpenAiProvider({ model }),
        runtime,
        emit,
        budget: {
          maxIterations: TASK_MAX_ITERATIONS,
          maxTokens: TASK_MAX_TOKENS,
          maxCostUsd: TASK_MAX_COST_USD,
          deadline: Date.now() + TASK_DEADLINE_MS,
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
      return { kind: "failed", costCents, error: `Agent stopped: ${stopReason}` };
    },
  };
}
