import type { Tool } from "@repo/agent-core";
import { publishChannel, sessionChannel } from "@repo/cache";
import { injectProjectRuntimeEnv } from "../inject-project-env";
import { publishStatus, type PersistFields } from "../persist";
import { createAskUserTool } from "./ask-user";
import { createRequestIntegrationTool } from "./request-integration";
import type { InteractiveToolContext } from "./types";

export function createInteractiveTools(ctx: InteractiveToolContext): Tool[] {
  return [createAskUserTool(ctx), createRequestIntegrationTool(ctx)];
}

export function createJobInteractiveTools(input: {
  projectId: string;
  sessionId: string;
  worktreeSessionId: string;
  signal: AbortSignal;
  deadlineAt: number;
  persist: (fields: PersistFields) => Promise<unknown>;
}): Tool[] {
  return createInteractiveTools({
    ...input,
    publishFrame: (frame) => publishChannel(sessionChannel(input.sessionId), frame),
    publishStatus: (detail) => publishStatus(input.sessionId, "RUNNING", detail),
    refreshRuntimeEnv: (runtime) =>
      injectProjectRuntimeEnv({ projectId: input.projectId, worktreeSessionId: input.worktreeSessionId, runtime }),
  });
}
