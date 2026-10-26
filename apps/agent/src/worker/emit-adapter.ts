import {
  isProviderCreditsDepleted,
  PROVIDER_CREDITS_DEPLETED_NOTICE,
  type AgentEvent,
  type AgentEventSink,
} from "@repo/agent-core";
import { publishChannel, sessionChannel } from "@repo/cache";
import { usdToCredits } from "@repo/contracts";
import { prisma } from "@repo/db";
import { createLogger } from "@repo/logger";
import { publishDelta, publishStatus, type PersistFields } from "./persist";

const log = createLogger("agent-job");

export interface EmitAdapterOptions {
  sessionId: string;
  userId: string;
  persist: (fields: PersistFields) => Promise<unknown>;
}

// Mirrors apps/api's createAgentEventHandler — same AgentEvent -> persisted
// row/SSE frame mapping, so the browser can't tell which process produced
// an event. Can't import that file directly (apps never import apps); this
// is the sandboxed path's own copy of the same small mapping.
export function createEmitAdapter(opts: EmitAdapterOptions): {
  emit: AgentEventSink;
} {
  const { sessionId, userId, persist } = opts;
  let textBuffer = "";

  const flushText = async (): Promise<void> => {
    const text = textBuffer.trim();
    textBuffer = "";
    if (text) await persist({ role: "assistant", type: "text", content: text });
  };

  const emit = async (event: AgentEvent): Promise<void> => {
    switch (event.type) {
      case "text_delta":
        textBuffer += event.delta;
        publishDelta(sessionId, event.delta);
        break;
      case "tool_call_start":
        await flushText();
        publishStatus(sessionId, "RUNNING", `Running ${event.toolName}…`);
        await persist({
          role: "assistant",
          type: "toolCall",
          content: event.toolName,
          data: {
            toolCallId: event.toolCallId,
            toolName: event.toolName,
            args: event.args,
            providerMeta: event.providerMeta ?? null,
          },
        });
        break;
      case "tool_call_end":
        await persist({
          role: "tool",
          type: "toolResponse",
          content: event.result,
          data: { toolCallId: event.toolCallId },
        });
        break;
      case "tool_error":
        await persist({
          role: "tool",
          type: "toolResponse",
          content: `Error: ${event.error}`,
          data: { toolCallId: event.toolCallId },
        });
        break;
      case "usage": {
        const [updatedSession, updatedUser] = await prisma.$transaction([
          prisma.session.update({
            where: { id: sessionId },
            data: {
              cost: { increment: event.costUsd },
              tokenIn: { increment: event.inputTokens },
              tokenOut: { increment: event.outputTokens },
            },
            select: { cost: true, tokenIn: true, tokenOut: true },
          }),
          prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: usdToCredits(event.costUsd) } },
            select: { credits: true },
          }),
        ]);
        await publishChannel(sessionChannel(sessionId), {
          kind: "usage",
          ...updatedSession,
          creditsRemaining: Math.max(0, updatedUser.credits),
        });
        break;
      }
      case "error": {
        const providerCreditsDepleted = isProviderCreditsDepleted(event.message);
        log.error("agent loop error", {
          sessionId,
          userId,
          providerCreditsDepleted,
          message: event.message,
        });
        await persist({
          role: "assistant",
          type: "text",
          content: providerCreditsDepleted
            ? PROVIDER_CREDITS_DEPLETED_NOTICE
            : `Something went wrong and the run stopped: ${event.message}`,
        });
        break;
      }
      case "agent_end":
        await flushText();
        break;
    }
  };

  return { emit };
}
