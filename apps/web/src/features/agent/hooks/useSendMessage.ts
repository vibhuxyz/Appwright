import { useMutation } from "@tanstack/react-query";
import type { ElementSelection, PromptAnswerValue, PromptQuestion } from "@repo/contracts";
import { agentApi } from "../api/agentApi";
import { agentStore } from "../store/agentStore";

export interface OutgoingMessage {
  prompt: string;
  answers?: Readonly<Record<string, PromptAnswerValue>>;
  questions?: readonly PromptQuestion[];
  selection?: ElementSelection;
}

export function useSendMessage(sessionId: string | undefined) {
  return useMutation({
    mutationFn: ({ prompt, answers, questions, selection }: OutgoingMessage) => {
      if (!sessionId) throw new Error("No active session");
      agentStore.getState().setStopNotice(null);
      agentStore.getState().setRunning(true, "Analyzing request & planning…");
      return agentApi.sendMessage(sessionId, prompt, answers, questions, selection);
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
