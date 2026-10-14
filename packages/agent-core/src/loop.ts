import { z } from "zod";
import { collectTurn, type PendingToolCall } from "./collect-turn";
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
}

function toToolSpecs(tools: Tool[]): ToolSpec[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    argsSchema: z.toJSONSchema(t.args),
  }));
}

// runAgentLoop — THE loop. Pure function of its params: no printing, no HTTP,
// no node:fs. Returns a StopReason, never void (D26).
export async function runAgentLoop(
  params: RunAgentLoopParams,
): Promise<StopReason> {
  const { tools, provider, runtime, emit, budget, signal, sessionId, onApprovalRequired } = params;
  const messages = [...params.messages];
  const toolSpecs = toToolSpecs(tools);
  const toolsByName = new Map(tools.map((t) => [t.name, t]));

  let seq = 0;
  const nextSeq = () => seq++;
  let iterations = 0;
  // Real counts when the provider reports them, a response-size estimate
  // when it does not (FakeProvider never does). The distinction matters for
  // money, not for the loop: budgetExceeded has to stay reachable either
  // way, or a provider that goes quiet silently removes the ceiling.
  let totalTokens = 0;
  let totalCostUsd = 0;

  const end = async (stopReason: StopReason): Promise<StopReason> => {
    await emit({ type: "agent_end", seq: nextSeq(), sessionId, stopReason });
    return stopReason;
  };

  await emit({ type: "agent_start", seq: nextSeq(), sessionId });

  try {
    while (true) {
      // Six exits, cheapest and most urgent first.
      if (signal.aborted) return end("cancelled");
      if (Date.now() > budget.deadline) return end("timeout");
      if (iterations >= budget.maxIterations) return end("maxIterations");
      if (totalTokens >= budget.maxTokens) return end("budgetExceeded");
      if (totalCostUsd >= budget.maxCostUsd) return end("budgetExceeded");
      iterations++;

      const { text, toolCalls, stopReason, usage } = await collectTurn(
        provider,
        messages,
        toolSpecs,
        signal,
        emit,
        sessionId,
        nextSeq,
      );

      if (usage) {
        const costUsdThisTurn = costUsd(
          provider.model,
          usage.inputTokens,
          usage.outputTokens,
        );
        totalTokens += usage.inputTokens + usage.outputTokens;
        totalCostUsd += costUsdThisTurn;
        await emit({
          type: "usage",
          seq: nextSeq(),
          sessionId,
          model: provider.model,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          costUsd: costUsdThisTurn,
        });
      } else {
        totalTokens += Math.ceil(
          (text.length + JSON.stringify(toolCalls).length) / 4,
        );
      }

      if (stopReason.reason === "length") {
        // A length stop means the arguments may be silently incomplete even
        // when the JSON parses — fail every tool call in this message rather
        // than executing on truncated input.
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
          messages.push({ role: "assistant", type: "text", content: text });
        }
        return end("completed");
      }

      // Any reasoning text the model streamed before its tool calls this
      // turn — push it so it's still part of the model's own context on the
      // next iteration; it was already streamed live via text_delta events,
      // this just stops it from being silently absent from messages[].
      if (text) {
        messages.push({ role: "assistant", type: "text", content: text });
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

      const sequential = toolCalls.filter((c) => {
        const tool = toolsByName.get(c.toolName);
        return !tool || tool.executionMode === "sequential";
      });
      const parallel = toolCalls.filter((c) => !sequential.includes(c));

      const runOne = async (call: PendingToolCall) => {
        await emit({
          type: "tool_call_start",
          seq: nextSeq(),
          sessionId,
          toolCallId: call.toolCallId,
          toolName: call.toolName,
          args: call.args as Record<string, unknown>,
          providerMeta: call.providerMeta,
        });

        const tool = toolsByName.get(call.toolName);
        let resultText = "";
        let failed = false;

        if (onApprovalRequired) {
          const approval = await onApprovalRequired({
            toolCallId: call.toolCallId,
            toolName: call.toolName,
            args: (call.args as Record<string, unknown>) ?? {},
          });
          if (!approval.approved) {
            resultText = approval.reason ?? "User denied permission for this action";
            failed = true;
          }
        }

        if (!failed) {
          if (!tool) {
            resultText = `Error: unknown tool "${call.toolName}"`;
            failed = true;
          } else {
            try {
              resultText = await tool.execute(call.args, { runtime });
            } catch (err) {
              resultText = `Error: ${err instanceof Error ? err.message : String(err)}`;
              failed = true;
            }
          }
        }

        if (failed) {
          await emit({
            type: "tool_error",
            seq: nextSeq(),
            sessionId,
            toolCallId: call.toolCallId,
            error: resultText,
          });
        } else {
          await emit({
            type: "tool_call_end",
            seq: nextSeq(),
            sessionId,
            toolCallId: call.toolCallId,
            result: resultText,
          });
        }

        messages.push({
          role: "tool",
          type: "toolResponse",
          toolCallId: call.toolCallId,
          content: resultText,
        });
      };

      // Parallel batch first (reads), then sequential calls one at a time
      // (writes/bash), preserving the model's requested order within each
      // group — never interleaved in a way that corrupts a shared file.
      await Promise.all(parallel.map(runOne));
      for (const call of sequential) {
        if (signal.aborted) return end("cancelled");
        await runOne(call);
      }
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
