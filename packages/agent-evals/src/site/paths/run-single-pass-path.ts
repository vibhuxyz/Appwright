import { buildSystemPrompt, runAgentLoop, type AgentEventSink, type Message } from "@repo/agent-core";
import { buildSinglePassBrief, deliverBlueprintPatterns } from "@repo/blueprint";
import { AGENT_LOOP_LIMITS } from "@repo/contracts";
import { ALL_TOOLS, guardTools } from "@repo/tools";
import { runTsc } from "@repo/verify";
import { createTraceCollector } from "../../runner";
import { PRODUCTION_VERIFY_REPAIR_ROUNDS, SINGLE_PASS_DEADLINE_MS, SINGLE_PASS_MAX_ITERATIONS } from "../constants";
import type { GroupConfig } from "../types";
import { repairMessage } from "./repair-message";
import type { PathContext, PathOutcome } from "./types";

function repairRoundLimit(context: PathContext): number {
  return context.repair === "production" ? PRODUCTION_VERIFY_REPAIR_ROUNDS : 0;
}

async function runLoopOnce(context: PathContext, messages: Message[], sink: AgentEventSink): Promise<string> {
  const { projectId, runtime, provider, signal } = context;
  return runAgentLoop({
    messages,
    tools: guardTools(ALL_TOOLS).tools,
    provider,
    runtime,
    emit: sink,
    budget: {
      maxIterations: SINGLE_PASS_MAX_ITERATIONS,
      maxTokens: AGENT_LOOP_LIMITS.maxTokens,
      maxCostUsd: context.generationCapUsd,
      deadline: Date.now() + SINGLE_PASS_DEADLINE_MS,
    },
    signal,
    sessionId: `${projectId}-single-pass`,
  });
}

async function runWithRepairs(context: PathContext, messages: Message[], sink: AgentEventSink) {
  const limit = repairRoundLimit(context);
  const state = { stopReason: await runLoopOnce(context, messages, sink), repairRounds: 0 };
  while (state.stopReason === "completed" && state.repairRounds < limit) {
    const check = await runTsc(context.workspaceDir);
    if (check.ok) break;
    messages.push({ role: "user", type: "text", content: repairMessage(check) });
    state.repairRounds += 1;
    state.stopReason = await runLoopOnce(context, messages, sink);
  }
  return state;
}

export async function runSinglePassPath(context: PathContext, config: GroupConfig, prompt: string): Promise<PathOutcome> {
  const { plan, projectId, runtime } = context;
  const shellPatterns = config.shellPatterns === "omitted" ? "omitted" : "included";
  const delivery = await deliverBlueprintPatterns({ blueprint: plan.blueprint, projectId }, runtime, await runtime.listDir("."), { shellPatterns });
  const brief = buildSinglePassBrief({ blueprint: plan.blueprint, slots: [], projectId, delivery });
  const systemPrompt = await buildSystemPrompt(runtime);
  const messages: Message[] = [
    { role: "user", type: "text", content: systemPrompt },
    { role: "user", type: "text", content: prompt },
    { role: "user", type: "text", content: brief.text },
  ];
  const collector = createTraceCollector();
  const { stopReason, repairRounds } = await runWithRepairs(context, messages, collector.sink);
  return {
    stopReason,
    repairRounds,
    toolCalls: collector.toolCalls().map((call) => ({ name: call.name, isError: call.isError })),
    errors: collector.events.flatMap((event) => (event.type === "error" ? [event.message] : [])),
    deliveredFiles: [...delivery.written, ...delivery.unchanged],
    deliverySkipped: delivery.skipped,
  };
}
