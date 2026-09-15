import { useMutation } from "@tanstack/react-query";
import { agentApi } from "../api/agentApi";
import { agentStore } from "../store/agentStore";

export function useSendMessage(sessionId: string | undefined) {
  return useMutation({
    mutationFn: (prompt: string) => {
      if (!sessionId) throw new Error("No active session");
      agentStore.getState().setStopNotice(null);
      agentStore.getState().setRunning(true, "Analyzing request & planning…");
      return agentApi.sendMessage(sessionId, prompt);
    },
    onError: (err: Error) => {
      agentStore.getState().setRunning(false);
      if (err.message.toLowerCase().includes("credit")) {
        agentStore.getState()
          .setStopNotice({ reason: "outOfCredits", detail: err.message });
      }
    },
  });
}

export function useStopConversation(sessionId: string | undefined) {
  return useMutation({
    mutationFn: () => {
      if (!sessionId) throw new Error("No active session");
      agentStore.getState().setRunning(true, "Stopping AI…");
      return agentApi.stopConversation(sessionId);
    },
    onSuccess: () => {
      agentStore.getState()
        .setStopNotice({ reason: "cancelled", detail: "Run stopped by user" });
    },
    onSettled: () => {
      agentStore.getState().setRunning(false);
    },
  });
}

export function useEnhancePrompt() {
  return useMutation({
    mutationFn: (prompt: string) => agentApi.enhancePrompt(prompt),
  });
}
