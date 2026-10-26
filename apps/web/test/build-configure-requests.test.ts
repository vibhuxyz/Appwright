import { describe, expect, it } from "bun:test";
import { INTEGRATION_CATALOG } from "@repo/contracts";
import { buildConfigureRequests } from "../src/features/environment/credential-setup/build-configure-requests";
import type { CredentialDraft } from "../src/features/environment/credential-setup/types";

function fieldsFor(provider: string) {
  return INTEGRATION_CATALOG.find((entry) => entry.provider === provider)?.fields ?? [];
}

const razorpayTest = {
  RAZORPAY_KEY_ID: "rzp_test_abc123",
  RAZORPAY_KEY_SECRET: "test-secret-value",
  RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
};

function draft(overrides: Partial<CredentialDraft>): CredentialDraft {
  return { choice: "YOUR_KEY", primaryValues: {}, hasSeparateProductionKey: false, productionValues: {}, ...overrides };
}

describe("buildConfigureRequests", () => {
  it("uses the Appwright test key for development and preview only", () => {
    const result = buildConfigureRequests({ provider: "razorpay", fields: fieldsFor("razorpay"), draft: draft({ choice: "APPWRIGHT_TEST_KEY" }) });
    expect(result.ok && result.requests.map((item) => [item.environment, item.credentialMode])).toEqual([
      ["development", "APPWRITE_MANAGED"],
      ["preview", "APPWRITE_MANAGED"],
    ]);
  });

  it("asks for a choice before submitting", () => {
    expect(buildConfigureRequests({ provider: "email", fields: fieldsFor("email"), draft: draft({ choice: null }) }).ok).toBe(false);
  });

  it("reports missing fields per scope instead of sending empty values", () => {
    const result = buildConfigureRequests({ provider: "razorpay", fields: fieldsFor("razorpay"), draft: draft({}) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors["primary:RAZORPAY_KEY_ID"]).toBe("Razorpay Key ID is required");
  });

  it("never sends a Razorpay test key to production", () => {
    const result = buildConfigureRequests({ provider: "razorpay", fields: fieldsFor("razorpay"), draft: draft({ primaryValues: razorpayTest }) });
    expect(result.ok && result.requests.map((item) => item.environment)).toEqual(["development", "preview"]);
    expect(result.ok && result.notice).toContain("live Razorpay key");
  });

  it("rejects a live Razorpay key for development", () => {
    const result = buildConfigureRequests({
      provider: "razorpay",
      fields: fieldsFor("razorpay"),
      draft: draft({ primaryValues: { ...razorpayTest, RAZORPAY_KEY_ID: "rzp_live_abc123" } }),
    });
    expect(result.ok).toBe(false);
  });

  it("reuses one key for every environment when no production key is given", () => {
    const result = buildConfigureRequests({
      provider: "email",
      fields: fieldsFor("email"),
      draft: draft({ primaryValues: { BREVO_API_KEY: "xkeysib-valid-key", EMAIL_FROM: "hi@example.com" } }),
    });
    expect(result.ok && result.requests.map((item) => item.environment)).toEqual(["development", "preview", "production"]);
  });
});
