import type { IntegrationProvider } from "@repo/contracts";

export type ManagedCredentials =
  | { provider: "email"; apiKey: string; emailFrom: string }
  | { provider: "razorpay"; keyId: string; keySecret: string }
  | { provider: "cloudinary"; cloudName: string; apiKey: string; apiSecret: string }
  | { provider: "mongodb" };

const RAZORPAY_TEST_KEY_PREFIX = "rzp_test_";

function envValue(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function managedEmail(): ManagedCredentials | null {
  const apiKey = envValue("APPWRITE_MANAGED_BREVO_API_KEY");
  const emailFrom = envValue("APPWRITE_MANAGED_EMAIL_FROM");
  return apiKey && emailFrom ? { provider: "email", apiKey, emailFrom } : null;
}

function managedRazorpay(): ManagedCredentials | null {
  const keyId = envValue("APPWRITE_MANAGED_RAZORPAY_KEY_ID");
  const keySecret = envValue("APPWRITE_MANAGED_RAZORPAY_KEY_SECRET");
  const isTestKey = keyId.startsWith(RAZORPAY_TEST_KEY_PREFIX);
  return isTestKey && keySecret ? { provider: "razorpay", keyId, keySecret } : null;
}

function managedCloudinary(): ManagedCredentials | null {
  const cloudName = envValue("CLOUDINARY_CLOUD_NAME");
  const apiKey = envValue("CLOUDINARY_API_KEY");
  const apiSecret = envValue("CLOUDINARY_API_SECRET");
  return cloudName && apiKey && apiSecret
    ? { provider: "cloudinary", cloudName, apiKey, apiSecret }
    : null;
}

function managedMongo(): ManagedCredentials | null {
  const clusterUri = envValue("MONGO_DB_PROJECT_DATABASE") || envValue("MONGODB_URI");
  return clusterUri ? { provider: "mongodb" } : null;
}

export function managedCredentials(provider: IntegrationProvider): ManagedCredentials | null {
  switch (provider) {
    case "email":
      return managedEmail();
    case "razorpay":
      return managedRazorpay();
    case "cloudinary":
      return managedCloudinary();
    case "mongodb":
      return managedMongo();
    default:
      return null;
  }
}

export function canUseManagedCredentials(provider: IntegrationProvider): boolean {
  return managedCredentials(provider) !== null;
}
