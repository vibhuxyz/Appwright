import { afterEach, describe, expect, it } from "bun:test";
import { chooseMongoTestUri } from "../src/lib/integration-tester";
import { canUseManagedCredentials, managedCredentials } from "../src/integration-runtime";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("managedCredentials", () => {
  it("reuses the platform Cloudinary account as the Appwright test key", () => {
    process.env.CLOUDINARY_CLOUD_NAME = "appwright";
    process.env.CLOUDINARY_API_KEY = "key";
    process.env.CLOUDINARY_API_SECRET = "secret";
    expect(managedCredentials("cloudinary")).toEqual({
      provider: "cloudinary",
      cloudName: "appwright",
      apiKey: "key",
      apiSecret: "secret",
    });
  });

  it("refuses a live Razorpay key as a test key", () => {
    process.env.APPWRITE_MANAGED_RAZORPAY_KEY_ID = "rzp_live_abc";
    process.env.APPWRITE_MANAGED_RAZORPAY_KEY_SECRET = "secret";
    expect(canUseManagedCredentials("razorpay")).toBe(false);
  });

  it("never offers managed Google OAuth", () => {
    expect(canUseManagedCredentials("google-oauth")).toBe(false);
  });
});

describe("chooseMongoTestUri", () => {
  it("tests the user's own URI before the Appwright database", () => {
    expect(chooseMongoTestUri("mongodb://own", "mongodb://platform")).toBe("mongodb://own");
    expect(chooseMongoTestUri(undefined, "mongodb://platform")).toBe("mongodb://platform");
    expect(chooseMongoTestUri("  ", null)).toBeNull();
  });
});
