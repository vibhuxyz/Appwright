import { createHmac } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import express from "express";
import type { Server } from "node:http";
import { prisma, setProjectEnvironmentVariable } from "@repo/db";
import { razorpayWebhookRouter, saveIntegrationRawBody } from "../src/routes/integrations/runtime";

const WEBHOOK_SECRET = "razorpay-webhook-secret-for-test";

interface WebhookTestContext {
  server: Server;
  baseUrl: string;
  projectId: string;
  userId: string;
}

let context: WebhookTestContext;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email: `razorpay-webhook-${crypto.randomUUID()}@example.com`,
      hashPassword: "test-password",
    },
  });
  const project = await prisma.project.create({
    data: {
      name: "Razorpay Webhook Test",
      workspacePath: `/tmp/razorpay-webhook-${crypto.randomUUID()}`,
      userId: user.id,
    },
  });
  await setProjectEnvironmentVariable({
    projectId: project.id,
    environment: "development",
    key: "RAZORPAY_WEBHOOK_SECRET",
    value: WEBHOOK_SECRET,
    isSecret: true,
  });
  const app = express();
  app.use(express.json({ verify: (request, _response, buffer) => saveIntegrationRawBody(request, buffer) }));
  app.use(razorpayWebhookRouter);
  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  context = { server, baseUrl: `http://127.0.0.1:${address.port}`, projectId: project.id, userId: user.id };
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    context.server.closeAllConnections?.();
    context.server.close(() => resolve());
  });
  await prisma.project.delete({ where: { id: context.projectId } });
  await prisma.user.delete({ where: { id: context.userId } });
});

describe("Razorpay webhook", () => {
  it("verifies raw-body signatures and acknowledges duplicate events safely", async () => {
    const body = JSON.stringify({
      event: "payment.failed",
      payload: { payment: { entity: { id: "pay_test123", order_id: "order_test123", amount: 100, currency: "INR" } } },
    });
    const signature = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
    const first = await postWebhook("event_test_1", signature, body);
    expect({ status: first.status, body: await first.text() }).toEqual({ status: 200, body: "{\"received\":true}" });

    const duplicate = await postWebhook("event_test_1", signature, body);
    expect(duplicate.status).toBe(200);
    expect(await duplicate.json()).toEqual({ received: true, duplicate: true });

    const forged = await postWebhook("event_test_2", "00".repeat(32), body);
    expect(forged.status).toBe(400);
  });
});

function postWebhook(eventId: string, signature: string, body: string) {
  return fetch(`${context.baseUrl}/v1/integrations/razorpay/webhooks/${context.projectId}/development`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-event-id": eventId,
      "x-razorpay-signature": signature,
    },
    body,
  });
}
