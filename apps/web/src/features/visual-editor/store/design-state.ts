import { create } from "zustand";
import {
  EMPTY_HISTORY,
  redo,
  revertChange,
  setChange,
  undo,
  type EditHistory,
} from "../lib/history";
import type { Breakpoint, DesignChange } from "../schemas/editor-schemas";

interface Intent {
  readonly componentId: string;
  readonly prompt: string;
}

interface DesignStateStore {
  history: EditHistory;
  intents: readonly Intent[];
  breakpoint: Breakpoint;
  selectedId: string | null;
  setChange: (change: DesignChange) => void;
  revertChange: (target: { componentId: string; property: string }) => void;
  addIntent: (intent: Intent) => void;
  undo: () => void;
  redo: () => void;
  setBreakpoint: (breakpoint: Breakpoint) => void;
  select: (componentId: string | null) => void;
  discard: () => void;
}

export const useDesignState = create<DesignStateStore>((set) => ({
  history: EMPTY_HISTORY,
  intents: [],
  breakpoint: "desktop",
  selectedId: null,
  setChange: (change) => set((s) => ({ history: setChange(s.history, change) })),
  revertChange: (target) =>
    set((s) => ({ history: revertChange(s.history, { ...target, breakpoint: s.breakpoint }) })),
  addIntent: (intent) => set((s) => ({ intents: [...s.intents, intent] })),
  undo: () => set((s) => ({ history: undo(s.history) })),
  redo: () => set((s) => ({ history: redo(s.history) })),
  setBreakpoint: (breakpoint) => set({ breakpoint }),
  select: (selectedId) => set({ selectedId }),
  discard: () => set({ history: EMPTY_HISTORY, intents: [], selectedId: null }),
}));
