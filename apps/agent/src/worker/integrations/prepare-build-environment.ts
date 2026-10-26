import type { Runtime } from "@repo/agent-core";
import { publishChannel, sessionChannel } from "@repo/cache";
import {
  AGENT_WAIT_LIMITS,
  AGENT_WAIT_STATUS,
  formatQuestionReplyContent,
  integrationQuestionSet,
  integrationReply,
} from "@repo/contracts";
import {
  expireIntegrationRequests,
  openRequiredIntegrationRequests,
  prisma,
  provisionProjectDatabase,
  type OpenedIntegrationRequest,
} from "@repo/db";
import { injectProjectRuntimeEnv } from "../inject-project-env";
import { publishStatus, type PersistFields } from "../persist";
import { awaitIntegrationRequests } from "./await-integration-requests";
import { integrationRequestFrame } from "./integration-request-frame";

export interface PrepareBuildEnvironmentInput {
  projectId: string;
  sessionId: string;
  worktreeSessionId: string;
  userId: string;
  needsDatabase: boolean;
  runtime: Runtime;
  signal: AbortSignal;
  persist: (fields: PersistFields) => Promise<unknown>;
}

const PROVIDER_NAMES: Readonly<Record<string, string>> = {
  razorpay: "Razorpay",
  cloudinary: "Cloudinary",
  email: "Brevo email",
  "google-oauth": "Google sign-in",
  mongodb: "the database",
};

function providerList(providers: readonly string[]): string {
  return providers.map((provider) => PROVIDER_NAMES[provider] ?? provider).join(", ");
}

async function usesOwnDevelopmentDatabase(projectId: string): Promise<boolean> {
  const row = await prisma.projectIntegrationEnvironment.findFirst({
    where: { environment: "development", status: "connected", integration: { projectId, provider: "mongodb" } },
    select: { credentialMode: true },
  });
  return row?.credentialMode === "BYOK";
}

async function waitForIntegrationChoices(
  input: PrepareBuildEnvironmentInput,
  opened: readonly OpenedIntegrationRequest[],
): Promise<"ready" | "cancelled"> {
  const createdAt = new Date();
  const ids = opened.map((request) => request.id);
  const providers = opened.map((request) => request.provider);
  const intro = `Before I build, choose how to connect ${providerList(providers)}. Pick the Appwright test key to start right away, or use your own keys.`;
  await input.persist({
    role: "assistant",
    type: "text",
    content: intro,
    data: { questionSet: integrationQuestionSet(intro, providers) },
  });
  await Promise.all(opened.map((request) => publishChannel(
    sessionChannel(input.sessionId),
    integrationRequestFrame({ ...request, sessionId: input.sessionId, projectId: input.projectId, createdAt }),
  )));
  publishStatus(input.sessionId, "RUNNING", AGENT_WAIT_STATUS.keys);
  const outcome = await awaitIntegrationRequests({ ids, signal: input.signal, timeoutMs: AGENT_WAIT_LIMITS.blueprintMs });
  if (outcome.status !== "resolved") await expireIntegrationRequests({ ids, now: new Date() });
  if (outcome.status === "aborted") return "cancelled";
  const outcomes = outcome.status === "timeout"
    ? opened.map((request) => ({ provider: request.provider, status: "EXPIRED" }))
    : outcome.value;
  const reply = integrationReply(outcomes);
  await input.persist({
    role: "user",
    type: "text",
    content: formatQuestionReplyContent(reply),
    data: { questionReply: reply },
  });
  const skipped = outcomes.filter((item) => item.status !== "CONNECTED").map((item) => item.provider);
  if (skipped.length > 0) {
    await input.persist({
      role: "assistant",
      type: "text",
      content: `Continuing without ${providerList(skipped)}. You can connect it later from Connectors.`,
    });
  }
  return "ready";
}

export async function prepareBuildEnvironment(input: PrepareBuildEnvironmentInput): Promise<"ready" | "cancelled"> {
  const opened = await openRequiredIntegrationRequests({
    projectId: input.projectId,
    sessionId: input.sessionId,
    expiresAt: new Date(Date.now() + AGENT_WAIT_LIMITS.blueprintMs),
  });
  if (opened.length > 0 && (await waitForIntegrationChoices(input, opened)) === "cancelled") return "cancelled";
  if (input.needsDatabase && !(await usesOwnDevelopmentDatabase(input.projectId))) {
    await provisionProjectDatabase({ projectId: input.projectId, environment: "development", actorUserId: input.userId });
  }
  await injectProjectRuntimeEnv({
    projectId: input.projectId,
    worktreeSessionId: input.worktreeSessionId,
    runtime: input.runtime,
  });
  return "ready";
}
