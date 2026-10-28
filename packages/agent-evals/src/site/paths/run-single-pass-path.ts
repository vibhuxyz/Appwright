import { buildSystemPrompt, runAgentLoop, type Message } from "@repo/agent-core";
import { buildSinglePassBrief, deliverBlueprintPatterns } from "@repo/blueprint";
import { AGENT_LOOP_LIMITS } from "@repo/contracts";
import { ALL_TOOLS, guardTools } from "@repo/tools";
import { createTraceCollector } from "../../runner";
import { SINGLE_PASS_DEADLINE_MS, SINGLE_PASS_MAX_ITERATIONS } from "../constants";
import type { GroupConfig } from "../types";
import type { PathContext, PathOutcome } from "./types";

export async function runSinglePassPath(context: PathContext, config: GroupConfig, prompt: string): Promise<PathOutcome> {
  const { plan, projectId, runtime, provider, signal } = context;
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
  const guard = guardTools(ALL_TOOLS);
  const stopReason = await runAgentLoop({
    messages,
    tools: guard.tools,
    provider,
    runtime,
    emit: collector.sink,
    budget: {
      maxIterations: SINGLE_PASS_MAX_ITERATIONS,
      maxTokens: AGENT_LOOP_LIMITS.maxTokens,
      maxCostUsd: context.generationCapUsd,
      deadline: Date.now() + SINGLE_PASS_DEADLINE_MS,
    },
    signal,
    sessionId: `${projectId}-single-pass`,
  });
  return {
    stopReason,
    toolCalls: collector.toolCalls().map((call) => ({ name: call.name, isError: call.isError })),
    errors: collector.events.flatMap((event) => (event.type === "error" ? [event.message] : [])),
    deliveredFiles: [...delivery.written, ...delivery.unchanged],
    deliverySkipped: delivery.skipped,
  };
}
