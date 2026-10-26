import { describe, expect, it } from "bun:test";
import type { Runtime } from "@repo/agent-core";
import type { TaskDetail } from "../src/load-task-detail";
import { generatePaymentAttempt } from "../src/generate-payment-attempt";

describe("generatePaymentAttempt", () => {
  it("generates server-side Razorpay gateway routes without a provider SDK", async () => {
    const files = new Map<string, string>();
    const runtime: Runtime = {
      readFile: async () => "",
      writeFile: async (path, content) => { files.set(path, content); },
      listDir: async () => [],
      exec: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
    };

    const result = await generatePaymentAttempt({} as TaskDetail, runtime);

    expect(result.kind).toBe("completed");
    expect(files.has("src/payments/appwrite-integrations.ts")).toBe(true);
    const client = files.get("src/payments/appwrite-integrations.ts") ?? "";
    expect(client).toContain("APPWRITE_INTEGRATION_TOKEN");
    expect(client).toContain("typeof window");
    expect(client).not.toContain("STRIPE_SECRET_KEY");
    expect(files.get("src/app/api/payments/orders/route.ts")).toContain("Idempotency-Key");
    expect(files.get("src/app/api/payments/verify/route.ts")).toContain("razorpay/verify");
  });
});
