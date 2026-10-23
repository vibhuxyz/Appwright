import type { Runtime } from "@repo/agent-core";
import type { GeneratedAttempt } from "orchestrator";
import type { TaskDetail } from "./load-task-detail";

const STRIPE_CLIENT = `import Stripe from "stripe";
import { env } from "@/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });
`;

const CHECKOUT_ROUTE = `import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";
import { stripe } from "@/payments/stripe";

const CheckoutInput = z.object({ priceId: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = CheckoutInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "priceId is required", details: parsed.error.flatten() } },
      { status: 400 },
    );
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: parsed.data.priceId, quantity: 1 }],
    success_url: \`\${env.NEXT_PUBLIC_SITE_URL}/checkout/success\`,
    cancel_url: \`\${env.NEXT_PUBLIC_SITE_URL}/checkout/cancelled\`,
  });
  return NextResponse.json({ url: session.url });
}
`;

const WEBHOOK_ROUTE = `import { NextResponse } from "next/server";
import { env } from "@/env";
import { stripe } from "@/payments/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "Missing signature" } }, { status: 400 });
  }
  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "Invalid signature" } }, { status: 400 });
  }

  // Business-specific handling per event.type (e.g. "checkout.session.completed")
  // stays project-specific — this skeleton only verifies and acknowledges the event.

  return NextResponse.json({ received: true, type: event.type });
}
`;

const PACKAGE_JSON_PATH = "package.json";
const STRIPE_PACKAGE_VERSION = "latest";

async function ensureStripeDependency(runtime: Runtime): Promise<void> {
  const raw = await runtime.readFile(PACKAGE_JSON_PATH);
  const pkg = JSON.parse(raw) as { dependencies?: Record<string, string> };
  if (pkg.dependencies?.stripe) return;
  pkg.dependencies = { ...pkg.dependencies, stripe: STRIPE_PACKAGE_VERSION };
  await runtime.writeFile(PACKAGE_JSON_PATH, `${JSON.stringify(pkg, null, 2)}\n`);
}

export async function generatePaymentAttempt(
  _task: TaskDetail,
  runtime: Runtime,
): Promise<GeneratedAttempt> {
  await ensureStripeDependency(runtime);

  const files = [
    { path: "src/payments/stripe.ts", content: STRIPE_CLIENT },
    { path: "src/app/api/payments/checkout/route.ts", content: CHECKOUT_ROUTE },
    { path: "src/app/api/payments/webhook/route.ts", content: WEBHOOK_ROUTE },
  ];

  await Promise.all(files.map((file) => runtime.writeFile(file.path, file.content)));

  return { kind: "completed", costCents: 0, writtenPaths: files.map((file) => file.path) };
}
