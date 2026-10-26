import type { Runtime } from "@repo/agent-core";
import type { SseFrame } from "@repo/cache";
import type { PersistFields } from "../persist";

export interface InteractiveToolContext {
  projectId: string;
  sessionId: string;
  worktreeSessionId: string;
  signal: AbortSignal;
  deadlineAt: number;
  publishFrame: (frame: SseFrame) => Promise<void>;
  publishStatus: (detail: string) => void;
  refreshRuntimeEnv: (runtime: Runtime) => Promise<void>;
  persist: (fields: PersistFields) => Promise<unknown>;
}
