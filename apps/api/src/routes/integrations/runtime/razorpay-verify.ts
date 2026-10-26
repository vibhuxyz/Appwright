import {
  RuntimePaymentStatusResponseSchema,
  RuntimeVerifyRazorpayPaymentRequestSchema,
} from "@repo/contracts";
import { managedCredentials, prisma, resolveProjectRuntimeEnvVars } from "@repo/db";
import { Router } from "express";
import { integrationRuntimeScope } from "./context";
import { runtimeError } from "./runtime-error";
import { verifyHmacSignature } from "./verify-hmac";

export const integrationPaymentVerifyRouter = Router();

integrationPaymentVerifyRouter.post("/v1/integrations/razorpay/verify", async (req, res) => {
  const parsed = RuntimeVerifyRazorpayPaymentRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    runtimeError(res, 400, "INVALID_INPUT", "Payment verification details are invalid");
    return;
  }
  const scope = integrationRuntimeScope(res);
  const order = await prisma.integrationPayment.findFirst({
    where: {
      projectId: scope.projectId,
      environment: scope.environment,
      provider: "razorpay",
      providerOrderId: parsed.data.orderId,
    },
  });
  if (!order) {
    runtimeError(res, 404, "PAYMENT_ORDER_NOT_FOUND", "The payment order does not belong to this project and environment");
    return;
  }
  if (order.paymentId && order.paymentId !== parsed.data.paymentId) {
    runtimeError(res, 409, "PAYMENT_ALREADY_RESOLVED", "This order has already been resolved with another payment");
    return;
  }
  const credentials = await resolveVerificationCredentials(order.projectId, order.environment, order.credentialMode);
  if (!credentials) {
    runtimeError(res, 422, "INTEGRATION_CONFIGURATION_REQUIRED", "Razorpay verification credentials are unavailable");
    return;
  }
  if (!verifyHmacSignature(
    credentials.keySecret,
    `${parsed.data.orderId}|${parsed.data.paymentId}`,
    parsed.data.signature,
  )) {
    runtimeError(res, 400, "INVALID_PAYMENT_SIGNATURE", "Razorpay payment signature verification failed");
    return;
  }
  const providerPayment = await fetchProviderPayment(credentials, parsed.data.paymentId);
  if (!providerPayment || providerPayment.order_id !== order.providerOrderId ||
      providerPayment.amount !== Number(order.amountMinor) || providerPayment.currency !== order.currency ||
      !["authorized", "captured"].includes(providerPayment.status)) {
    runtimeError(res, 422, "PAYMENT_NOT_CONFIRMED", "Razorpay could not confirm a matching authorized payment");
    return;
  }
  const status = providerPayment.status === "captured" ? "captured" : "authorized";
  const updated = await prisma.integrationPayment.update({
    where: { id: order.id },
    data: { paymentId: parsed.data.paymentId, status },
  });
  res.json(RuntimePaymentStatusResponseSchema.parse({
    orderId: updated.providerOrderId,
    paymentId: updated.paymentId,
    status,
    amountMinor: updated.amountMinor.toString(),
    currency: updated.currency,
  }));
});

async function resolveVerificationCredentials(
  projectId: string,
  environment: string,
  credentialMode: string,
): Promise<{ keyId: string; keySecret: string } | null> {
  if (credentialMode === "APPWRITE_MANAGED") {
    const managed = managedCredentials("razorpay");
    return managed?.provider === "razorpay" ? { keyId: managed.keyId, keySecret: managed.keySecret } : null;
  }
  if (environment !== "development" && environment !== "preview" && environment !== "production") return null;
  const values = await resolveProjectRuntimeEnvVars({ projectId, environment });
  const keyId = values.RAZORPAY_KEY_ID;
  const keySecret = values.RAZORPAY_KEY_SECRET;
  return keyId && keySecret ? { keyId, keySecret } : null;
}

interface ProviderPayment {
  order_id: string;
  amount: number;
  currency: string;
  status: string;
}

async function fetchProviderPayment(
  credentials: { keyId: string; keySecret: string },
  paymentId: string,
): Promise<ProviderPayment | null> {
  try {
    const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString("base64")}`,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!isProviderPayment(body)) return null;
    return {
      order_id: body.order_id,
      amount: body.amount,
      currency: body.currency,
      status: body.status,
    };
  } catch {
    return null;
  }
}

function isProviderPayment(value: unknown): value is ProviderPayment {
  return typeof value === "object" && value !== null &&
    "order_id" in value && typeof value.order_id === "string" &&
    "currency" in value && typeof value.currency === "string" &&
    "status" in value && typeof value.status === "string" &&
    "amount" in value && typeof value.amount === "number";
}
