import { createHash } from "node:crypto";
import { prisma, resolveProjectRuntimeEnvVars } from "@repo/db";
import { Router } from "express";
import { IntegrationEnvironmentSchema } from "@repo/contracts";
import { runtimeError } from "./runtime-error";
import { getIntegrationRawBody } from "./raw-body";
import { verifyHmacSignature } from "./verify-hmac";

export const razorpayWebhookRouter = Router();

razorpayWebhookRouter.post("/v1/integrations/razorpay/webhooks/:projectId/:environment", async (req, res) => {
  const environment = IntegrationEnvironmentSchema.safeParse(req.params.environment);
  const eventId = req.header("x-razorpay-event-id") ?? "";
  const signature = req.header("x-razorpay-signature") ?? "";
  const rawBody = getIntegrationRawBody(req);
  if (!environment.success || !/^[A-Za-z0-9_-]{1,128}$/.test(eventId) ||
      !/^[a-f0-9]{64}$/i.test(signature) || !Buffer.isBuffer(rawBody)) {
    runtimeError(res, 400, "INVALID_WEBHOOK", "Razorpay webhook headers or payload are invalid");
    return;
  }
  const secret = await getWebhookSecret(req.params.projectId, environment.data);
  if (!secret) {
    runtimeError(res, 404, "WEBHOOK_NOT_CONFIGURED", "No Razorpay webhook is configured for this project environment");
    return;
  }
  if (!verifyHmacSignature(secret, rawBody, signature)) {
    runtimeError(res, 400, "INVALID_WEBHOOK_SIGNATURE", "Razorpay webhook signature verification failed");
    return;
  }
  const event = parsePaymentEvent(req.body);
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");
  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.integrationWebhookEvent.create({
        data: { projectId: req.params.projectId, provider: "razorpay", eventId, payloadHash },
      });
      if (!event) return;
      const payment = await transaction.integrationPayment.findFirst({
        where: {
          projectId: req.params.projectId,
          environment: environment.data,
          provider: "razorpay",
          providerOrderId: event.orderId,
        },
      });
      if (!payment || payment.amountMinor !== BigInt(event.amount) || payment.currency !== event.currency) return;
      const status = event.eventType === "payment.captured"
        ? "captured"
        : event.eventType === "payment.authorized"
          ? "authorized"
          : "failed";
      if (payment.status !== "captured") {
        await transaction.integrationPayment.update({
          where: { id: payment.id },
          data: { paymentId: event.paymentId, status },
        });
      }
    });
    res.status(200).json({ received: true });
  } catch (error) {
    if (isUniqueConflict(error)) {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }
    throw error;
  }
});

async function getWebhookSecret(projectId: string, environment: "development" | "preview" | "production") {
  const values = await resolveProjectRuntimeEnvVars({ projectId, environment });
  return values.RAZORPAY_WEBHOOK_SECRET ?? null;
}

interface PaymentEvent {
  eventType: "payment.captured" | "payment.authorized" | "payment.failed";
  orderId: string;
  paymentId: string;
  amount: string;
  currency: string;
}

function parsePaymentEvent(value: unknown): PaymentEvent | null {
  if (typeof value !== "object" || value === null || !("event" in value) ||
      !["payment.captured", "payment.authorized", "payment.failed"].includes(String(value.event)) ||
      !("payload" in value) || typeof value.payload !== "object" || value.payload === null ||
      !("payment" in value.payload) || typeof value.payload.payment !== "object" ||
      value.payload.payment === null || !("entity" in value.payload.payment) ||
      typeof value.payload.payment.entity !== "object" || value.payload.payment.entity === null) return null;
  const entity = value.payload.payment.entity;
  if (!("order_id" in entity) || typeof entity.order_id !== "string" ||
      !("id" in entity) || typeof entity.id !== "string" ||
      !("amount" in entity) || typeof entity.amount !== "number" ||
      !("currency" in entity) || typeof entity.currency !== "string") return null;
  return {
    eventType: value.event as PaymentEvent["eventType"],
    orderId: entity.order_id,
    paymentId: entity.id,
    amount: String(entity.amount),
    currency: entity.currency,
  };
}

function isUniqueConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
