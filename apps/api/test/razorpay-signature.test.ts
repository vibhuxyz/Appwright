import { createHmac } from "node:crypto";
import { describe, expect, it } from "bun:test";
import { verifyHmacSignature } from "../src/routes/integrations/runtime";

const WEBHOOK_SECRET = "razorpay-test-webhook-secret";
const PAYMENT_PAYLOAD = "order_test123|pay_test123";

function sign(payload: string | Buffer): string {
  return createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
}

describe("Razorpay signature verification", () => {
  it("accepts valid payment and raw webhook signatures", () => {
    const webhookPayload = Buffer.from("{\"event\":\"payment.captured\"}");

    expect(verifyHmacSignature(WEBHOOK_SECRET, PAYMENT_PAYLOAD, sign(PAYMENT_PAYLOAD))).toBe(true);
    expect(verifyHmacSignature(WEBHOOK_SECRET, webhookPayload, sign(webhookPayload))).toBe(true);
  });

  it("rejects forged payloads, malformed signatures, and wrong secrets", () => {
    const signature = sign(PAYMENT_PAYLOAD);

    expect(verifyHmacSignature(WEBHOOK_SECRET, `${PAYMENT_PAYLOAD}-forged`, signature)).toBe(false);
    expect(verifyHmacSignature("wrong-secret", PAYMENT_PAYLOAD, signature)).toBe(false);
    expect(verifyHmacSignature(WEBHOOK_SECRET, PAYMENT_PAYLOAD, "00".repeat(32))).toBe(false);
    expect(verifyHmacSignature(WEBHOOK_SECRET, PAYMENT_PAYLOAD, "bad-signature")).toBe(false);
  });
});
