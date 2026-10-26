import type { VariableScope } from "@repo/contracts";
import {
  buildIntegrationGatewayEnv,
  decryptSecret,
  getActiveEmailProvider,
  prisma,
  resolveProjectRuntimeEnvVars,
} from "@repo/db";
import { log } from "../log";
import { PUBLIC_API_URL } from "../env";

export function shouldSyncKey(
  key: string,
  activeEmailProvider: string,
  emailRequired: boolean,
): boolean {
  if (key.startsWith("APPWRITE_MANAGED_") || key.startsWith("APPWRITE_INTERNAL_")) return false;
  const isEmailSecret =
    key.startsWith("SMTP_") ||
    key === "RESEND_API_KEY" ||
    key === "BREVO_API_KEY";

  if (!emailRequired && isEmailSecret) return false;
  if (activeEmailProvider === "resend" && (key.startsWith("SMTP_") || key === "BREVO_API_KEY")) {
    return false;
  }
  if (activeEmailProvider === "brevo" && (key.startsWith("SMTP_") || key === "RESEND_API_KEY")) {
    return false;
  }
  if (activeEmailProvider === "nodemailer" && (key === "RESEND_API_KEY" || key === "BREVO_API_KEY")) {
    return false;
  }
  return true;
}

export async function upsertVercelEnvVar(input: {
  vercelProjectId: string;
  accessToken: string;
  teamId: string | null;
  key: string;
  value: string;
  target: string[];
}): Promise<void> {
  const url = new URL(`https://api.vercel.com/v10/projects/${input.vercelProjectId}/env`);
  if (input.teamId) url.searchParams.set("teamId", input.teamId);
  url.searchParams.set("upsert", "true");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: input.key,
      value: input.value,
      type: "encrypted",
      target: input.target,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Vercel env upsert failed (${response.status})`);
  }
}

export async function syncProjectVariablesToVercel(input: {
  projectId: string;
  targetEnvironment: VariableScope;
}): Promise<{ syncedCount: number; keys: string[]; target: string }> {
  const { projectId, targetEnvironment } = input;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      integrations: true,
      user: { include: { vercelConnection: true } },
    },
  });

  if (!project?.vercelProjectId) {
    throw new Error("NOT_LINKED: Project is not linked to a Vercel project");
  }

  const connection = project.user.vercelConnection;
  if (!connection) {
    throw new Error("NOT_CONNECTED: User is not connected to Vercel");
  }

  if (targetEnvironment === "all") {
    throw new Error("INVALID_TARGET: Cannot sync scope 'all' directly to Vercel");
  }

  const emailIntegration = project.integrations.find((i) => i.provider === "email");
  const activeEmail = await getActiveEmailProvider(projectId, targetEnvironment);
  const emailRequired = emailIntegration?.required ?? false;

  const accessToken = decryptSecret(connection.encryptedToken);
  const [vars, gatewayVars] = await Promise.all([
    resolveProjectRuntimeEnvVars({ projectId, environment: targetEnvironment }),
    buildIntegrationGatewayEnv({ projectId, environment: targetEnvironment, apiUrl: PUBLIC_API_URL }),
  ]);
  const deployVars = { ...vars, ...gatewayVars };

  const syncedKeys: string[] = [];
  for (const [key, value] of Object.entries(deployVars)) {
    if (!value || !shouldSyncKey(key, activeEmail, emailRequired)) continue;
    try {
      await upsertVercelEnvVar({
        vercelProjectId: project.vercelProjectId,
        accessToken,
        teamId: connection.teamId,
        key,
        value,
        target: [targetEnvironment],
      });
      syncedKeys.push(key);
    } catch (err) {
      log.error("Failed to sync env var to Vercel", {
        projectId,
        key,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    syncedCount: syncedKeys.length,
    keys: syncedKeys,
    target: targetEnvironment,
  };
}
