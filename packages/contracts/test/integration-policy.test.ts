import { describe, expect, it } from "bun:test";
import {
  ALL_INTEGRATION_CREDENTIAL_KEYS,
  integrationCredentialKeys,
  isManagedCredentialAllowed,
  isSecretCredentialKey,
  managedUsageLimit,
  summarizeIntegrationStatus,
  toRecordedStatus,
} from "../src/integration-policy";

describe("integration credential keys", () => {
  it("derives provider keys from the catalog", () => {
    expect(integrationCredentialKeys("razorpay")).toEqual([
      "RAZORPAY_KEY_ID",
      "RAZORPAY_KEY_SECRET",
      "RAZORPAY_WEBHOOK_SECRET",
    ]);
    expect(integrationCredentialKeys("mongodb")).toEqual(["MONGODB_URI"]);
    expect(integrationCredentialKeys("realtime")).toEqual([]);
  });

  it("marks secret keys and lists every credential key once", () => {
    expect(isSecretCredentialKey("CLOUDINARY_API_SECRET")).toBe(true);
    expect(isSecretCredentialKey("EMAIL_FROM")).toBe(false);
    expect(ALL_INTEGRATION_CREDENTIAL_KEYS.has("MONGODB_URI")).toBe(true);
  });
});

describe("managed credential policy", () => {
  it("allows Appwright test keys only outside production, except the database", () => {
    expect(isManagedCredentialAllowed("razorpay", "development")).toBe(true);
    expect(isManagedCredentialAllowed("razorpay", "production")).toBe(false);
    expect(isManagedCredentialAllowed("mongodb", "production")).toBe(true);
    expect(isManagedCredentialAllowed("google-oauth", "development")).toBe(false);
  });

  it("returns the managed quota per provider", () => {
    expect(managedUsageLimit("cloudinary")).toBe(10);
    expect(managedUsageLimit("mongodb")).toBe(0);
  });
});

describe("integration status rules", () => {
  it("maps test results to recorded statuses", () => {
    expect(toRecordedStatus("verified")).toBe("connected");
    expect(toRecordedStatus("invalid")).toBe("test_failed");
    expect(toRecordedStatus("configured")).toBe("configured");
  });

  it("summarizes per-environment statuses without letting one test overwrite the rest", () => {
    expect(summarizeIntegrationStatus({ environmentStatuses: ["test_failed", "connected"], required: true })).toBe("connected");
    expect(summarizeIntegrationStatus({ environmentStatuses: ["test_failed"], required: true })).toBe("missing");
    expect(summarizeIntegrationStatus({ environmentStatuses: [], required: false })).toBe("not_required");
  });
});
