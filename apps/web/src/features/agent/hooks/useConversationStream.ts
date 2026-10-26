import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AGENT_WAIT_STATUS, type AssetRequestResponse } from "@repo/contracts";
import { connectConversationStream } from "@/realtime/connectionManager";
import { assetKeys } from "@/features/assets/api/query-keys";
import { environmentKeys } from "@/features/environment";
import { agentApi } from "../api/agentApi";
import { agentQuestionKeys } from "../questions";
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
  const queryClient = useQueryClient();
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
                agentStore.getState().setRunning(true, "Plan ready. Asking for images…");
              } else if (/choose an image/i.test(message.content)) {
                agentStore.getState().setRunning(true, "Waiting for section images…");
              }
            }
          },
          onAssetRequest: ({ assetRequest }) => {
            queryClient.setQueryData<AssetRequestResponse[]>(assetKeys.requests(sessionId), (current) => {
              const list = current ?? [];
              return [...list.filter((item) => item.id !== assetRequest.id), assetRequest];
            });
            if (assetRequest.status === "RESOLVED") {
              if (agentStore.getState().statusDetail === "Waiting for section images…") {
                agentStore.getState().setRunning(false);
              }
              return;
            }
            agentStore.getState().setRunning(true, "Waiting for section images…");
          },
          onStatus: (frame) => {
            if (frame.status === "RUNNING") {
              agentStore.getState().setRunning(true, frame.detail ?? "AI is working…");
              agentStore.getState().setStopNotice(null);
            } else if (frame.status === "AWAITING_APPROVAL") {
              agentStore.getState().setRunning(true, frame.detail ?? "Waiting for your approval");
            } else {
              agentStore.getState().setRunning(false);
              void queryClient.invalidateQueries({ queryKey: agentQuestionKeys.pending(sessionId) });
              void queryClient.invalidateQueries({ queryKey: environmentKeys.allPending });
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
          onIntegrationConfig: ({ request }) => {
            void queryClient.invalidateQueries({ queryKey: environmentKeys.pending(request.projectId) });
            agentStore.getState().setRunning(true, AGENT_WAIT_STATUS.keys);
          },
          onIntakeProgress: ({ tool, detail, items }) => {
            agentStore.getState().pushIntakeStep({ tool, detail, items: items ?? [] });
          },
          onAgentQuestion: ({ question }) => {
            void queryClient.invalidateQueries({ queryKey: agentQuestionKeys.pending(sessionId) });
            if (question.status === "PENDING") agentStore.getState().setRunning(true, AGENT_WAIT_STATUS.answers);
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
