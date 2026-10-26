import { createHash } from "node:crypto";
import {
  MANAGED_EMAIL_OPERATION,
  RuntimeTransactionalEmailRequestSchema,
  managedUsageLimit,
} from "@repo/contracts";
import {
  completeIntegrationUsage,
  getEmailProvider,
  managedCredentials,
  prisma,
  reserveIntegrationUsage,
  sendProjectEmail,
} from "@repo/db";
import { Router } from "express";
import { integrationRuntimeScope } from "./context";
import { runtimeError } from "./runtime-error";

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

export const integrationEmailRouter = Router();

integrationEmailRouter.post("/v1/integrations/email/send", async (req, res) => {
  const parsed = RuntimeTransactionalEmailRequestSchema.safeParse(req.body);
  const idempotencyKey = req.header("Idempotency-Key") ?? "";
  if (!parsed.success || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    runtimeError(res, 400, "INVALID_INPUT", "A valid transactional email and Idempotency-Key are required");
    return;
  }
  const scope = integrationRuntimeScope(res);
  const config = await prisma.projectIntegrationEnvironment.findFirst({
    where: {
      environment: scope.environment,
      status: "connected",
      integration: { projectId: scope.projectId, provider: "email" },
    },
    select: { credentialMode: true },
  });
  if (!config) {
    runtimeError(res, 422, "INTEGRATION_NOT_CONFIGURED", "Brevo is not connected for this environment");
    return;
  }
  const credentialMode = config.credentialMode === "APPWRITE_MANAGED" ? "APPWRITE_MANAGED" : "BYOK";
  const fingerprint = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex");
  const reservation = await reserveIntegrationUsage({
    projectId: scope.projectId,
    provider: "email",
    credentialMode,
    environment: scope.environment,
    operation: MANAGED_EMAIL_OPERATION,
    idempotencyKey,
    requestFingerprint: fingerprint,
    ...(credentialMode === "APPWRITE_MANAGED" ? { limit: managedUsageLimit("email") } : {}),
  });
  if (!reservation.ok) {
    if (reservation.reason === "quota_exhausted") {
      runtimeError(res, 429, "INTEGRATION_QUOTA_EXHAUSTED", "Your Appwrite-managed Brevo allowance is exhausted. Connect your own Brevo account or upgrade your plan.", {
        integration: "email",
        used: reservation.used,
        limit: reservation.limit,
        nextAction: "connect_byok_or_upgrade",
      });
      return;
    }
    runtimeError(res, 409, "IDEMPOTENCY_CONFLICT", "This idempotency key was already used for a different email request");
    return;
  }
  if (reservation.isDuplicate && reservation.resultJson) {
    const priorResult = reservation.resultJson as { status?: unknown };
    if (priorResult.status === "failed") {
      runtimeError(res, 502, "EMAIL_PROVIDER_REJECTED", "Brevo did not accept the transactional email request");
      return;
    }
    res.json(reservation.resultJson);
    return;
  }

  const providerResult = credentialMode === "APPWRITE_MANAGED"
    ? await sendManagedEmail(parsed.data)
    : await sendProjectEmail({ ...parsed.data, projectId: scope.projectId, environment: scope.environment });
  await completeIntegrationUsage({
    usageId: reservation.usageId,
    isAccepted: providerResult.ok,
    ...(providerResult.messageId ? { providerRequestId: providerResult.messageId } : {}),
    resultJson: providerResult.ok
      ? { status: "accepted", provider: "brevo", messageId: providerResult.messageId ?? null, credentialMode }
      : { status: "failed" },
  });
  if (!providerResult.ok) {
    runtimeError(res, 502, "EMAIL_PROVIDER_REJECTED", "Brevo did not accept the transactional email request");
    return;
  }
  res.status(202).json({
    status: "accepted",
    provider: "brevo",
    ...(providerResult.messageId ? { messageId: providerResult.messageId } : {}),
    credentialMode,
  });
});

async function sendManagedEmail(input: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const credentials = managedCredentials("email");
  if (credentials?.provider !== "email") return { ok: false, error: "Managed Brevo is not configured" };
  return getEmailProvider("brevo").sendEmail({ ...input, from: credentials.emailFrom }, {
    BREVO_API_KEY: credentials.apiKey,
    EMAIL_FROM: credentials.emailFrom,
  });
}
