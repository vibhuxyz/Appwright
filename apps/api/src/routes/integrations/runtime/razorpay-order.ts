import { createHash } from "node:crypto";
import {
  MANAGED_RAZORPAY_OPERATION,
  RuntimeCreateRazorpayOrderRequestSchema,
  RuntimeCreateRazorpayOrderResponseSchema,
  managedUsageLimit,
} from "@repo/contracts";
import {
  completeIntegrationUsage,
  managedCredentials,
  prisma,
  reserveIntegrationUsage,
  resolveProjectRuntimeEnvVars,
} from "@repo/db";
import { Router } from "express";
import { integrationRuntimeScope } from "./context";
import { runtimeError } from "./runtime-error";

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

export const integrationPaymentOrderRouter = Router();

integrationPaymentOrderRouter.post("/v1/integrations/razorpay/orders", async (req, res) => {
  const parsed = RuntimeCreateRazorpayOrderRequestSchema.safeParse(req.body);
  const idempotencyKey = req.header("Idempotency-Key") ?? "";
  if (!parsed.success || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    runtimeError(res, 400, "INVALID_INPUT", "A valid order request and Idempotency-Key are required");
    return;
  }
  const scope = integrationRuntimeScope(res);
  const environmentConfig = await prisma.projectIntegrationEnvironment.findFirst({
    where: {
      environment: scope.environment,
      status: "connected",
      integration: { projectId: scope.projectId, provider: "razorpay" },
    },
    select: { credentialMode: true },
  });
  if (!environmentConfig) {
    runtimeError(res, 422, "INTEGRATION_NOT_CONFIGURED", "Razorpay is not connected for this environment");
    return;
  }
  const credentialMode = environmentConfig.credentialMode === "APPWRITE_MANAGED" ? "APPWRITE_MANAGED" : "BYOK";
  if (credentialMode === "APPWRITE_MANAGED" && scope.environment === "production") {
    runtimeError(res, 422, "PRODUCTION_CONFIGURATION_REQUIRED", "Production payments require your own live Razorpay account");
    return;
  }
  const credentials = await resolveRazorpayCredentials(scope.projectId, scope.environment, credentialMode);
  if (!credentials) {
    runtimeError(res, 422, "INTEGRATION_CONFIGURATION_REQUIRED", "Razorpay credentials are incomplete for this environment");
    return;
  }
  const requestFingerprint = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex");
  const reservation = await reserveIntegrationUsage({
    projectId: scope.projectId,
    provider: "razorpay",
    credentialMode,
    environment: scope.environment,
    operation: MANAGED_RAZORPAY_OPERATION,
    idempotencyKey,
    requestFingerprint,
    ...(credentialMode === "APPWRITE_MANAGED" ? { limit: managedUsageLimit("razorpay") } : {}),
  });
  if (!reservation.ok) {
    if (reservation.reason === "quota_exhausted") {
      runtimeError(res, 429, "INTEGRATION_QUOTA_EXHAUSTED", "Your Appwrite-managed Razorpay test allowance is exhausted. Connect your own account to continue.", {
        integration: "razorpay", used: reservation.used, limit: reservation.limit, nextAction: "connect_byok_or_upgrade",
      });
      return;
    }
    runtimeError(res, 409, "IDEMPOTENCY_CONFLICT", "This idempotency key was already used for a different order request");
    return;
  }
  if (reservation.isDuplicate) {
    if (reservation.resultJson) {
      const previousResult = reservation.resultJson as { status?: unknown };
      if (previousResult.status === "failed") {
        runtimeError(res, 502, "PAYMENT_PROVIDER_REJECTED", "Razorpay did not accept the order request");
        return;
      }
      res.json(RuntimeCreateRazorpayOrderResponseSchema.parse(reservation.resultJson));
      return;
    }
    runtimeError(res, 409, "REQUEST_IN_PROGRESS", "The order request is still being processed");
    return;
  }

  const result = await createProviderOrder(credentials, parsed.data);
  if (!result) {
    await completeIntegrationUsage({ usageId: reservation.usageId, isAccepted: false, resultJson: { status: "failed" } });
    runtimeError(res, 502, "PAYMENT_PROVIDER_REJECTED", "Razorpay did not accept the order request");
    return;
  }
  await prisma.integrationPayment.create({
    data: {
      projectId: scope.projectId,
      provider: "razorpay",
      environment: scope.environment,
      credentialMode,
      providerOrderId: result.id,
      amountMinor: BigInt(parsed.data.amountMinor),
      currency: parsed.data.currency,
      status: "created",
      idempotencyKey,
    },
  });
  const response = {
    orderId: result.id,
    amountMinor: parsed.data.amountMinor,
    currency: parsed.data.currency,
    keyId: credentials.keyId,
    environment: scope.environment,
    credentialMode,
  };
  await completeIntegrationUsage({
    usageId: reservation.usageId,
    isAccepted: true,
    providerRequestId: result.id,
    resultJson: response,
  });
  res.status(201).json(RuntimeCreateRazorpayOrderResponseSchema.parse(response));
});

async function resolveRazorpayCredentials(projectId: string, environment: string, mode: "APPWRITE_MANAGED" | "BYOK") {
  if (mode === "APPWRITE_MANAGED") {
    const managed = managedCredentials("razorpay");
    return managed?.provider === "razorpay" ? { keyId: managed.keyId, keySecret: managed.keySecret } : null;
  }
  const values = await resolveProjectRuntimeEnvVars({ projectId, environment: environment as "development" | "preview" | "production" });
  const keyId = values.RAZORPAY_KEY_ID;
  const keySecret = values.RAZORPAY_KEY_SECRET;
  return keyId && keySecret ? { keyId, keySecret } : null;
}

async function createProviderOrder(
  credentials: { keyId: string; keySecret: string },
  input: { amountMinor: string; currency: string; receipt?: string },
): Promise<{ id: string } | null> {
  try {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: Number(input.amountMinor), currency: input.currency, receipt: input.receipt }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null || !("id" in body) || typeof body.id !== "string" || !/^order_[A-Za-z0-9]+$/.test(body.id)) return null;
    return { id: body.id };
  } catch {
    return null;
  }
}
