import type { AgentEvent } from "@repo/agent-core";
import { prisma } from "@repo/db";
import { log } from "../log";
import {
  publishDelta,
  publishStatus,
  publishUsage,
} from "../stream/sse";
import type { MessageRow } from "./message-mapper";

export interface EventHandlerOptions {
  sessionId: string;
  userId: string;
  persist: (fields: {
    role: string;
    type: string;
    content: string;
    data?: Record<string, unknown>;
  }) => Promise<MessageRow>;
}

export function createAgentEventHandler(opts: EventHandlerOptions) {
  const { sessionId, userId, persist } = opts;
  let textBuffer = "";

  const emit = async (event: AgentEvent) => {
    switch (event.type) {
      case "text_delta":
        textBuffer += event.delta;
        publishDelta(sessionId, event.delta);
        break;
      case "tool_call_start":
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
        const tokensUsed = event.inputTokens + event.outputTokens;
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
            data: { credits: { decrement: tokensUsed } },
            select: { credits: true },
          }),
        ]);
        publishUsage(sessionId, {
          kind: "usage",
          ...updatedSession,
          creditsRemaining: Math.max(0, updatedUser.credits),
        });
        break;
      }
      case "error":
        log.error("agent loop error", { sessionId, message: event.message });
        await persist({
          role: "assistant",
          type: "text",
          content: `Something went wrong and the run stopped: ${event.message}`,
        });
        break;
      case "agent_end":
        if (textBuffer) {
          await persist({ role: "assistant", type: "text", content: textBuffer });
          textBuffer = "";
        }
        break;
    }
  };

  return { emit };
}
