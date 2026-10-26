import type { Runtime } from "@repo/agent-core";
import type { GeneratedAttempt } from "orchestrator";
import type { TaskDetail } from "./load-task-detail";

const INTEGRATION_CLIENT = `import { z } from "zod";

function integrationConfig() {
  if (typeof window !== "undefined") throw new Error("Integration gateway calls must run on the server");
  const apiUrl = process.env.APPWRITE_API_URL;
  const token = process.env.APPWRITE_INTEGRATION_TOKEN;
  if (!apiUrl || !token) throw new Error("Appwrite integration gateway is not configured");
  return { apiUrl: apiUrl.replace(/\\/+$/, ""), token };
}

export async function callIntegration<T>(path: string, body: unknown, responseSchema: z.ZodType<T>, idempotencyKey?: string): Promise<T> {
  const { apiUrl, token } = integrationConfig();
  const response = await fetch(\u0060\u007bapiUrl\u007d/v1/integrations/\u007bpath\u007d\u0060, {
    method: "POST",
    headers: {
      Authorization: \u0060Bearer \u007btoken\u007d\u0060,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const result: unknown = await response.json();
  if (!response.ok) throw new Error("The Appwrite integration request failed");
  return responseSchema.parse(result);
}
`;

const CREATE_ORDER_ROUTE = `import { NextResponse } from "next/server";
import { z } from "zod";
import { callIntegration } from "@/payments/appwrite-integrations";

const Input = z.object({
  amountMinor: z.string().regex(/^[1-9][0-9]{0,11}$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
  receipt: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/).optional(),
}).strict();
const Result = z.object({
  orderId: z.string(),
  amountMinor: z.string(),
  currency: z.string().length(3),
  keyId: z.string(),
  environment: z.enum(["development", "preview", "production"]),
  credentialMode: z.enum(["APPWRITE_MANAGED", "BYOK"]),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "A same-origin checkout request is required" } }, { status: 403 });
  }
  const parsed = Input.safeParse(await request.json());
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!parsed.success || !idempotencyKey || !/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
    return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "Enter a valid amount, currency, and Idempotency-Key" } }, { status: 400 });
  }
  try {
    const result = await callIntegration("razorpay/orders", parsed.data, Result, idempotencyKey);
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: { code: "PAYMENT_ORDER_FAILED", message: "Could not create the payment order" } }, { status: 502 });
  }
}
`;

const VERIFY_PAYMENT_ROUTE = `import { NextResponse } from "next/server";
import { z } from "zod";
import { callIntegration } from "@/payments/appwrite-integrations";

const Input = z.object({
  orderId: z.string().regex(/^order_[A-Za-z0-9]+$/),
  paymentId: z.string().regex(/^pay_[A-Za-z0-9]+$/),
  signature: z.string().regex(/^[a-f0-9]{64}$/i),
}).strict();
const Result = z.object({
  orderId: z.string(),
  paymentId: z.string().nullable(),
  status: z.enum(["created", "authorized", "captured", "failed"]),
  amountMinor: z.string(),
  currency: z.string(),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "A same-origin payment request is required" } }, { status: 403 });
  }
  const parsed = Input.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "Payment verification details are invalid" } }, { status: 400 });
  }
  try {
    const result = await callIntegration("razorpay/verify", parsed.data, Result);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: { code: "PAYMENT_VERIFICATION_FAILED", message: "Razorpay could not confirm the payment" } }, { status: 422 });
  }
}
`;

export async function generatePaymentAttempt(
  _task: TaskDetail,
  runtime: Runtime,
): Promise<GeneratedAttempt> {
  const files = [
    { path: "src/payments/appwrite-integrations.ts", content: INTEGRATION_CLIENT },
    { path: "src/app/api/payments/orders/route.ts", content: CREATE_ORDER_ROUTE },
    { path: "src/app/api/payments/verify/route.ts", content: VERIFY_PAYMENT_ROUTE },
  ];
  await Promise.all(files.map((file) => runtime.writeFile(file.path, file.content)));
  return { kind: "completed", costCents: 0, writtenPaths: files.map((file) => file.path) };
}
