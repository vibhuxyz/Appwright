import { useEffect, useRef } from "react";
import { connectConversationStream } from "@/realtime/connectionManager";
import { agentApi } from "../api/agentApi";
import { agentStore } from "../store/agentStore";
import type { SessionStatus } from "../schemas/agentSchemas";

export interface SessionUsage {
  cost: number;
  tokenIn: number;
  tokenOut: number;
  creditsRemaining?: number;
}

// Opens the SSE connection for one session: fetches the transcript so far,
// seeds the store, then streams live frames into it. Runs once per
// sessionId — a new callback identity for `onUsage` must not tear the
// connection down, so it's read through a ref.
export function useConversationStream(
  sessionId: string | undefined,
  initialStatus: SessionStatus | undefined,
  onUsage?: (usage: SessionUsage) => void,
) {
  const onUsageRef = useRef(onUsage);
  useEffect(() => {
    onUsageRef.current = onUsage;
  }, [onUsage]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let disconnect: (() => void) | undefined;

    (async () => {
      const history = await agentApi.getConversation(sessionId, -1);
      if (cancelled) return;
      agentStore.getState()
        .reset(history, initialStatus === "RUNNING", initialStatus === "RUNNING" ? "AI is working…" : "");

      const lastSeq = history.at(-1)?.seq ?? -1;
      disconnect = connectConversationStream(
        agentApi.streamUrl(sessionId, lastSeq),
        {
          onMessage: ({ message }) => {
            agentStore.getState().appendMessage(message);
            if (message.type === "toolCall") {
              const toolName = message.content || message.data?.toolName;
              agentStore.getState()
                .setRunning(true, toolName ? `Running ${toolName}…` : "");
            }
            if (message.role === "assistant" && message.type === "text" && message.data?.intake !== true) {
              if (message.content.startsWith("Plan:\n")) {
                agentStore.getState().setRunning(true, "Plan ready. Executing tasks…");
              } else {
                agentStore.getState().setRunning(false);
              }
            }
          },
          onStatus: (frame) => {
            if (frame.status === "RUNNING") {
              agentStore.getState().setRunning(true, frame.detail ?? "AI is working…");
              agentStore.getState().setStopNotice(null);
            } else {
              agentStore.getState().setRunning(false);
              if (frame.reason && frame.reason !== "completed") {
                agentStore.getState().setStopNotice({
                  reason: frame.reason,
                  detail: frame.detail ?? "Run stopped",
                });
              }
            }
          },
          onDelta: (frame) => {
            agentStore.getState().setRunning(true, "Generating response…");
            agentStore.getState().setDelta((d) => d + frame.delta);
          },
          onUsage: (frame) => {
            onUsageRef.current?.(frame);
          },
        },
      );
    })();

    return () => {
      cancelled = true;
      disconnect?.();
    };
    // `initialStatus` is only read once, to seed the store at connect time —
    // it must not reopen the connection if the session object is refetched
    // later with a different status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
}
