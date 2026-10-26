import type { AgentEvent, AgentEventSink } from "@repo/agent-core";
import type { ToolCallRecord } from "../core/types";

export interface TraceCollector {
  readonly sink: AgentEventSink;
  readonly events: AgentEvent[];
  toolCalls(): ToolCallRecord[];
  finalText(): string;
  costUsd(): number;
}

export function createTraceCollector(): TraceCollector {
  const events: AgentEvent[] = [];
  return {
    events,
    sink: (event) => {
      events.push(event);
    },
    toolCalls: () =>
      events.flatMap((event) => {
        if (event.type !== "tool_call_start") return [];
        const failure = events.find(
          (other) => other.type === "tool_error" && other.toolCallId === event.toolCallId,
        );
        return [
          {
            name: event.toolName,
            args: event.args,
            isError: failure !== undefined,
            errorMessage: failure?.type === "tool_error" ? failure.error : "",
          },
        ];
      }),
    finalText: () => {
      const lastToolIndex = events.findLastIndex((event) => event.type === "tool_call_end");
      return events
        .slice(lastToolIndex + 1)
        .flatMap((event) => (event.type === "text_delta" ? [event.delta] : []))
        .join("");
    },
    costUsd: () =>
      events.reduce((total, event) => (event.type === "usage" ? total + event.costUsd : total), 0),
  };
}
