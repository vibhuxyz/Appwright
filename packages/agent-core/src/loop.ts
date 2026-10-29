import { z } from "zod";
import { collectTurnWithRetry, runToolCalls } from "./agent-loop";
import { costUsd } from "./providers/pricing";
import type { Provider, ToolSpec } from "./providers/types";
import type { Runtime } from "./runtime";
import type { AgentEventSink, Budget, Message, StopReason } from "./types";

export interface Tool {
  name: string;
  description: string;
  args: z.ZodType;
  executionMode: "parallel" | "sequential";
  capabilityHint?: string;
  execute(args: unknown, ctx: { runtime: Runtime }): Promise<string>;
}

export type ApprovalHook = (call: {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}) => Promise<{ approved: boolean; reason?: string }>;

export interface RunAgentLoopParams {
  messages: Message[];
  tools: Tool[];
  provider: Provider;
  runtime: Runtime;
  emit: AgentEventSink;
  budget: Budget;
  signal: AbortSignal;
  sessionId: string;
  onApprovalRequired?: ApprovalHook;
  fallbackProviders?: Provider[];
  providerRetryDelayMs?: number;
}

function toToolSpecs(tools: Tool[]): ToolSpec[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    argsSchema: z.toJSONSchema(t.args),
  }));
}

const UNFINISHED_TOOL_RESULT = "Error: this tool call did not finish because the run stopped.";

export async function runAgentLoop(
  params: RunAgentLoopParams,
): Promise<StopReason> {
  const { tools, provider, runtime, emit, budget, signal, sessionId, onApprovalRequired } = params;
  const providers = [provider, ...(params.fallbackProviders ?? [])];
  const messages = [...params.messages];
  const toolSpecs = toToolSpecs(tools);
  const toolsByName = new Map(tools.map((t) => [t.name, t]));

  let seq = 0;
  const nextSeq = () => seq++;
  let iterations = 0;
  let estimatedTokens = 0;
  let totalCostUsd = 0;

  const openCallIds = new Set<string>();

  const closeOpenCalls = async (): Promise<void> => {
    for (const toolCallId of [...openCallIds]) {
      openCallIds.delete(toolCallId);
      await emit({
        type: "tool_error",
        seq: nextSeq(),
        sessionId,
        toolCallId,
        error: UNFINISHED_TOOL_RESULT,
      });
    }
  };

  const end = async (stopReason: StopReason): Promise<StopReason> => {
    await closeOpenCalls();
    await emit({ type: "agent_end", seq: nextSeq(), sessionId, stopReason });
    return stopReason;
  };

  await emit({ type: "agent_start", seq: nextSeq(), sessionId });

  try {
    while (true) {
      if (signal.aborted) return end("cancelled");
      if (Date.now() > budget.deadline) return end("timeout");
      if (iterations >= budget.maxIterations) return end("maxIterations");
      if (estimatedTokens >= budget.maxTokens) return end("budgetExceeded");
      if (totalCostUsd >= budget.maxCostUsd) return end("budgetExceeded");
      iterations++;

      const {
        turn: { text, toolCalls, stopReason, usage, providerMeta },
        billedModel,
      } = await collectTurnWithRetry(
        providers,
        messages,
        toolSpecs,
        signal,
        emit,
        sessionId,
        nextSeq,
        params.providerRetryDelayMs ?? 200,
      );

      if (usage) {
        const costUsdThisTurn = costUsd(billedModel, usage);
        totalCostUsd += costUsdThisTurn;
        await emit({
          type: "usage",
          seq: nextSeq(),
          sessionId,
          model: billedModel,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          ...(usage.cachedInputTokens ? { cachedInputTokens: usage.cachedInputTokens } : {}),
          costUsd: costUsdThisTurn,
        });
      } else {
        estimatedTokens += Math.ceil(
          (text.length + JSON.stringify(toolCalls).length) / 4,
        );
      }

      if (stopReason.reason === "length") {
        messages.push({ role: "assistant", type: "text", content: text });
        for (const call of toolCalls) {
          await emit({
            type: "tool_error",
            seq: nextSeq(),
            sessionId,
            toolCallId: call.toolCallId,
            error: "truncated: provider hit a length stop mid tool-call",
          });
          messages.push({
            role: "tool",
            type: "toolResponse",
            toolCallId: call.toolCallId,
            content:
              "Error: response was truncated before this call's arguments completed.",
          });
        }
        continue;
      }

      if (toolCalls.length === 0) {
        if (text) {
          messages.push({
            role: "assistant",
            type: "text",
            content: text,
            providerMeta,
          });
        }
        return end("completed");
      }

      if (text) {
        messages.push({
          role: "assistant",
          type: "text",
          content: text,
          providerMeta,
        });
      }

      for (const call of toolCalls) {
        messages.push({
          role: "assistant",
          type: "toolCall",
          toolCallId: call.toolCallId,
          content: {
            toolName: call.toolName,
            args: call.args as Record<string, unknown>,
            providerMeta: call.providerMeta,
          },
        });
      }

      const outcome = await runToolCalls({
        calls: toolCalls,
        toolsByName,
        messages,
        runtime,
        signal,
        sessionId,
        emit,
        nextSeq,
        openCallIds,
        ...(onApprovalRequired ? { onApprovalRequired } : {}),
      });
      if (outcome === "cancelled") return end("cancelled");
    }
  } catch (err) {
    if (signal.aborted) return end("cancelled");
    await emit({
      type: "error",
      seq: nextSeq(),
      sessionId,
      message: err instanceof Error ? err.message : String(err),
    });
    return end("fatalError");
  }
}
