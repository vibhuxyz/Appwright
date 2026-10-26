import { describe, expect, it } from "bun:test";
import { parseIntegrationCredentialValues } from "./credential-values";

describe("parseIntegrationCredentialValues", () => {
  it("requires Razorpay test keys outside production", () => {
    expect(parseIntegrationCredentialValues("razorpay", "development", {
      RAZORPAY_KEY_ID: "rzp_live_abc123",
      RAZORPAY_KEY_SECRET: "provider-secret",
      RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
    })).toBeNull();
  });

  it("accepts live Razorpay credentials only in production", () => {
    expect(parseIntegrationCredentialValues("razorpay", "production", {
      RAZORPAY_KEY_ID: "rzp_live_abc123",
      RAZORPAY_KEY_SECRET: "provider-secret",
      RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
    })).toMatchObject({ RAZORPAY_KEY_ID: "rzp_live_abc123" });
    expect(parseIntegrationCredentialValues("razorpay", "preview", {
      RAZORPAY_KEY_ID: "rzp_live_abc123",
      RAZORPAY_KEY_SECRET: "provider-secret",
      RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
    })).toBeNull();
  });

  it("rejects unknown keys instead of saving them", () => {
    expect(parseIntegrationCredentialValues("email", "development", {
      BREVO_API_KEY: "brevo-valid-key",
      EMAIL_FROM: "verified@example.com",
      RAZORPAY_KEY_SECRET: "unexpected",
    })).toBeNull();
  });

  it("accepts MongoDB connection strings and rejects other schemes", () => {
    expect(parseIntegrationCredentialValues("mongodb", "production", {
      MONGODB_URI: "mongodb+srv://user:secret@cluster.example.net/app",
    })).toMatchObject({ MONGODB_URI: "mongodb+srv://user:secret@cluster.example.net/app" });
    expect(parseIntegrationCredentialValues("mongodb", "development", {
      MONGODB_URI: "postgres://user:secret@db.example.net/app",
    })).toBeNull();
  });
});
