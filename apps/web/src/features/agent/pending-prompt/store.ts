import { create } from "zustand";

export interface PendingAgentPrompt {
  prompt: string;
}

interface PendingPromptState {
  pending: PendingAgentPrompt | null;
  request: (prompt: string) => void;
  clear: () => void;
}

export const usePendingPromptStore = create<PendingPromptState>((set) => ({
  pending: null,
  request: (prompt) => set({ pending: { prompt } }),
  clear: () => set({ pending: null }),
}));

export const pendingPromptStore = usePendingPromptStore;
