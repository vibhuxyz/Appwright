import { create } from "zustand";
import type { Msg, StopNotice } from "../schemas/agentSchemas";
import { nextRunSteps } from "./run-steps";

export type IntakeTool = "request" | "questions" | "planner";

export interface IntakeStep {
  tool: IntakeTool;
  detail: string;
  items: readonly string[];
}

interface AgentState {
  messages: Msg[];
  delta: string;
  running: boolean;
  statusDetail: string;
  runSteps: readonly string[];
  stopNotice: StopNotice | null;
  lastSeq: number;
  intakeSteps: readonly IntakeStep[];
  reset: (messages: Msg[], running: boolean, statusDetail: string) => void;
  appendMessage: (message: Msg) => void;
  setRunning: (running: boolean, statusDetail?: string) => void;
  setDelta: (delta: string | ((prev: string) => string)) => void;
  setStopNotice: (notice: StopNotice | null) => void;
  pushIntakeStep: (step: IntakeStep) => void;
  clearIntakeSteps: () => void;
}

const MAX_INTAKE_STEPS = 60;

// Streaming agent state is highly realtime — hundreds of events per run — so
// it lives here rather than in TanStack Query, which is for settled server
// state, not a token-rate event feed.
//
// `agentStore` is the same object as the hook below, exported under a
// non-`use`-prefixed name for imperative access (`.getState()` outside
// render — inside effects, realtime handlers, mutations). The react-hooks
// lint rule treats any `use*` identifier as a hook and flags `.getState()`
// on it as an illegal ref read during render; this alias sidesteps that
// false positive without changing behavior.
export const useAgentStore = create<AgentState>((set) => ({
  messages: [],
  delta: "",
  running: false,
  statusDetail: "",
  runSteps: [],
  stopNotice: null,
  lastSeq: -1,
  intakeSteps: [],

  reset: (messages, running, statusDetail) =>
    set({
      messages,
      running,
      statusDetail,
      runSteps: running ? nextRunSteps([], statusDetail) : [],
      delta: "",
      stopNotice: null,
      lastSeq: messages.at(-1)?.seq ?? -1,
      intakeSteps: [],
    }),

  appendMessage: (message) =>
    set((state) => {
      if (state.messages.some((m) => m.seq === message.seq)) return state;
      return {
        messages: [...state.messages, message].sort((a, b) => a.seq - b.seq),
        delta: "",
        lastSeq: Math.max(state.lastSeq, message.seq),
      };
    }),

  setRunning: (running, statusDetail = "") =>
    set((state) => ({
      running,
      statusDetail,
      runSteps: running ? nextRunSteps(state.runSteps, statusDetail) : [],
    })),
  setDelta: (delta) =>
    set((state) => ({
      delta: typeof delta === "function" ? delta(state.delta) : delta,
    })),
  setStopNotice: (stopNotice) => set({ stopNotice }),
  pushIntakeStep: (step) =>
    set((state) => {
      const isSame = (existing: IntakeStep) => existing.tool === step.tool && existing.detail === step.detail;
      if (!state.intakeSteps.some(isSame)) return { intakeSteps: [...state.intakeSteps, step].slice(-MAX_INTAKE_STEPS) };
      return { intakeSteps: state.intakeSteps.map((existing) => (isSame(existing) ? step : existing)) };
    }),
  clearIntakeSteps: () => set({ intakeSteps: [] }),
}));

export const agentStore = useAgentStore;
