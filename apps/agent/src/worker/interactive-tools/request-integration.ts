import type { Runtime, Tool } from "@repo/agent-core";
import {
  AGENT_TOOL_RESULT_MARKERS,
  AGENT_WAIT_LIMITS,
  AGENT_WAIT_STATUS,
  RequestIntegrationArgsSchema,
  integrationReply,
} from "@repo/contracts";
import { expireIntegrationRequests, openIntegrationRequest, settleIntegrationRequests } from "@repo/db";
import { awaitIntegrationRequests, describeConnection, integrationRequestFrame } from "../integrations";
import { saveQuestionReply } from "./save-reply";
import type { InteractiveToolContext } from "./types";
import { computeWaitBudgetMs } from "./wait-budget";

const DESCRIPTION =
  "Ask the user to connect a provider (razorpay, cloudinary, email, google-oauth, mongodb) and wait until it is connected. " +
  "The user picks the Appwright test key or their own key in a secure card; you never see or handle the secret. " +
  "Call it before writing code that needs the provider. Always explain the reason in one short sentence.";

async function requestIntegration(ctx: InteractiveToolContext, rawArgs: unknown, runtime: Runtime): Promise<string> {
  const parsed = RequestIntegrationArgsSchema.safeParse(rawArgs);
  if (!parsed.success) return `Error: invalid request_integration arguments: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`;
  const waitMs = computeWaitBudgetMs({
    limitMs: AGENT_WAIT_LIMITS.integrationMs,
    deadlineAt: ctx.deadlineAt,
    now: Date.now(),
    safetyMarginMs: AGENT_WAIT_LIMITS.safetyMarginMs,
    minimumWaitMs: AGENT_WAIT_LIMITS.minimumWaitMs,
  });
  const createdAt = new Date();
  const request = await openIntegrationRequest({
    sessionId: ctx.sessionId,
    projectId: ctx.projectId,
    provider: parsed.data.provider,
    reason: parsed.data.reason,
    expiresAt: new Date(createdAt.getTime() + Math.max(waitMs, AGENT_WAIT_LIMITS.minimumWaitMs)),
  });
  const current = await settleIntegrationRequests({ ids: [request.id], now: createdAt });
  const alreadyConnected = current.outcomes.find((outcome) => outcome.status === "CONNECTED");
  if (alreadyConnected) return describeConnection(alreadyConnected);
  if (waitMs === 0) {
    await expireIntegrationRequests({ ids: [request.id], now: new Date() });
    return `There is not enough run time left to wait. Build against the gateway and tell the user to connect ${parsed.data.provider} from Connectors.`;
  }

  await ctx.publishFrame(integrationRequestFrame({ ...request, sessionId: ctx.sessionId, projectId: ctx.projectId, reason: parsed.data.reason, createdAt }));
  ctx.publishStatus(AGENT_WAIT_STATUS.keys);
  const outcome = await awaitIntegrationRequests({ ids: [request.id], signal: ctx.signal, timeoutMs: waitMs });
  if (outcome.status !== "resolved") {
    await expireIntegrationRequests({ ids: [request.id], now: new Date() });
    if (outcome.status === "aborted") return `${AGENT_TOOL_RESULT_MARKERS.cancelled} the run was stopped while waiting for the integration.`;
    await saveQuestionReply(ctx, integrationReply([{ provider: parsed.data.provider, status: "EXPIRED" }]));
    return `The user did not connect ${parsed.data.provider} in time. Build against the gateway, keep the feature disabled with a clear message, and say so in your summary.`;
  }
  await saveQuestionReply(ctx, integrationReply(outcome.value));
  ctx.publishStatus("Continuing…");
  await ctx.refreshRuntimeEnv(runtime);
  return outcome.value.map(describeConnection).join("\n");
}

export function createRequestIntegrationTool(ctx: InteractiveToolContext): Tool {
  return {
    name: "request_integration",
    description: DESCRIPTION,
    capabilityHint: "Ask the user to connect a provider with an Appwright test key or their own key, then wait.",
    args: RequestIntegrationArgsSchema,
    executionMode: "sequential",
    execute: (args, toolContext) => requestIntegration(ctx, args, toolContext.runtime),
  };
}
