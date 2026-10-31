import { useEffect, useRef } from "react";
import { pendingPromptStore } from "./store";

export function usePendingAgentPrompt(options: {
  sessionId: string | undefined;
  isBlocked: boolean;
  send: (prompt: string) => void;
  fillDraft: (prompt: string) => void;
}) {
  const pending = pendingPromptStore((state) => state.pending);
  const sendRef = useRef(options.send);
  const fillRef = useRef(options.fillDraft);

  useEffect(() => {
    sendRef.current = options.send;
    fillRef.current = options.fillDraft;
  }, [options.send, options.fillDraft]);

  useEffect(() => {
    if (!pending || !options.sessionId) return;
    pendingPromptStore.getState().clear();
    if (options.isBlocked) {
      fillRef.current(pending.prompt);
      return;
    }
    sendRef.current(pending.prompt);
  }, [pending, options.sessionId, options.isBlocked]);
}
