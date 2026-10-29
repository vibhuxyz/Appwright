import type { Runtime, Tool } from "@repo/agent-core";
import { publishChannel, sessionChannel } from "@repo/cache";
import { injectProjectRuntimeEnv } from "../inject-project-env";
import { publishStatus, type PersistFields } from "../persist";
import { createAskUserTool } from "./ask-user";
import { createRequestIntegrationTool } from "./request-integration";
import { createTaskAskUserTool } from "./task-ask-user";
import type { InteractiveToolContext } from "./types";

export function createInteractiveTools(ctx: InteractiveToolContext): Tool[] {
  return [createAskUserTool(ctx), createRequestIntegrationTool(ctx)];
}

interface JobToolInput {
  projectId: string;
  sessionId: string;
  worktreeSessionId: string;
  signal: AbortSignal;
  persist: (fields: PersistFields) => Promise<unknown>;
}

function jobChannels(input: JobToolInput) {
  return {
    publishFrame: (frame: Parameters<typeof publishChannel>[1]) => publishChannel(sessionChannel(input.sessionId), frame),
    publishStatus: (detail: string) => publishStatus(input.sessionId, "RUNNING", detail),
    refreshRuntimeEnv: (runtime: Runtime) =>
      injectProjectRuntimeEnv({ projectId: input.projectId, worktreeSessionId: input.worktreeSessionId, runtime }),
  };
}

export function createJobInteractiveTools(input: JobToolInput & { deadlineAt: number }): Tool[] {
  return createInteractiveTools({ ...input, ...jobChannels(input) });
}

export function createTaskInteractiveTools(input: JobToolInput): Tool[] {
  return [createTaskAskUserTool({ ...input, ...jobChannels(input) })];
}
