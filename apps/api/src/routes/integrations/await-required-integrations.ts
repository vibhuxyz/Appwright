import { AGENT_WAIT_LIMITS, AGENT_WAIT_STATUS } from "@repo/contracts";
import {
  expireIntegrationRequests,
  openRequiredIntegrationRequests,
  pollUntil,
  settleIntegrationRequests,
} from "@repo/db";
import { publishIntegrationConfigRequired, publishStatus } from "../../stream/sse";

export async function awaitRequiredIntegrations(input: {
  projectId: string;
  sessionId: string;
  signal: AbortSignal;
}): Promise<"ready" | "cancelled"> {
  const createdAt = new Date();
  const opened = await openRequiredIntegrationRequests({
    projectId: input.projectId,
    sessionId: input.sessionId,
    expiresAt: new Date(createdAt.getTime() + AGENT_WAIT_LIMITS.blueprintMs),
  });
  if (opened.length === 0) return "ready";

  for (const request of opened) {
    publishIntegrationConfigRequired(input.sessionId, {
      id: request.id,
      sessionId: input.sessionId,
      projectId: input.projectId,
      provider: request.provider,
      required: true,
      reason: request.reason,
      environment: "development",
      createdAt: createdAt.toISOString(),
    });
  }
  publishStatus(input.sessionId, "RUNNING", AGENT_WAIT_STATUS.keys);
  const ids = opened.map((request) => request.id);
  const outcome = await pollUntil({
    check: async () => {
      const settled = await settleIntegrationRequests({ ids, now: new Date() });
      return settled.pendingCount === 0 ? settled.outcomes : null;
    },
    signal: input.signal,
    timeoutMs: AGENT_WAIT_LIMITS.blueprintMs,
    pollMs: AGENT_WAIT_LIMITS.pollMs,
  });
  if (outcome.status !== "resolved") await expireIntegrationRequests({ ids, now: new Date() });
  return outcome.status === "aborted" ? "cancelled" : "ready";
}
