import type {
  IntegrationProvider,
  IntegrationStatus,
  TestIntegrationResponse,
} from "@repo/contracts";
import { getEmailProvider, getActiveEmailProvider } from "../email";
import { getProjectRuntimeMongoUri } from "./project-database-env";
import { mongoDatabaseProvider } from "./database-provider";
import { resolveProjectRuntimeEnvVars } from "./environment-registry";
import { ProjectDatabaseError } from "./project-database-errors";

interface TestIntegrationInput {
  projectId: string;
  provider: IntegrationProvider;
  environment: "development" | "preview" | "production";
}

export function chooseMongoTestUri(ownUri: string | undefined, platformUri: string | null): string | null {
  return ownUri?.trim() || platformUri;
}

async function platformMongoUri(
  projectId: string,
  environment: "development" | "preview" | "production",
): Promise<string | null> {
  try {
    return await getProjectRuntimeMongoUri({ projectId, environment });
  } catch (error) {
    if (error instanceof ProjectDatabaseError && error.code === "NOT_READY") return null;
    throw error;
  }
}

async function testMongoIntegration(
  projectId: string,
  environment: "development" | "preview" | "production",
): Promise<{ status: IntegrationStatus; message: string }> {
  const [envVars, platformUri] = await Promise.all([
    resolveProjectRuntimeEnvVars({ projectId, environment }),
    platformMongoUri(projectId, environment),
  ]);
  const uri = chooseMongoTestUri(envVars.MONGODB_URI, platformUri);
  if (!uri && environment === "production") {
    return { status: "configured", message: "The Appwright database is created on first deploy." };
  }
  if (!uri) {
    return { status: "missing", message: `MongoDB is not configured for ${environment}` };
  }

  const result = await mongoDatabaseProvider.testConnection(uri);
  return {
    status: result.ok ? "verified" : "invalid",
    message: result.message,
  };
}

async function testAuthIntegration(
  projectId: string,
  environment: "development" | "preview" | "production",
): Promise<{ status: IntegrationStatus; message: string }> {
  const envVars = await resolveProjectRuntimeEnvVars({ projectId, environment });
  const secret = envVars.AUTH_SECRET;

  if (!secret) {
    return {
      status: "missing",
      message: "AUTH_SECRET is not configured",
    };
  }

  if (secret.length < 16) {
    return {
      status: "invalid",
      message: "AUTH_SECRET is too short (must be at least 16 characters)",
    };
  }

  return {
    status: "verified",
    message: "Auth.js configuration is valid",
  };
}

async function testCloudinaryIntegration(
  projectId: string,
  environment: "development" | "preview" | "production",
): Promise<{ status: IntegrationStatus; message: string }> {
  const envVars = await resolveProjectRuntimeEnvVars({ projectId, environment });
  const cloudName = envVars.CLOUDINARY_CLOUD_NAME;
  const apiKey = envVars.CLOUDINARY_API_KEY;
  const apiSecret = envVars.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      status: "missing",
      message: "Cloudinary credentials (cloud name, API key, API secret) are incomplete",
    };
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/ping`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      return { status: "verified", message: "Cloudinary credentials verified successfully" };
    }
    return { status: "invalid", message: `Cloudinary rejected credentials (${res.status})` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: "invalid", message: `Cloudinary connection check failed: ${msg}` };
  }
}

async function testRazorpayIntegration(
  projectId: string,
  environment: "development" | "preview" | "production",
): Promise<{ status: IntegrationStatus; message: string }> {
  const envVars = await resolveProjectRuntimeEnvVars({ projectId, environment });
  const keyId = envVars.RAZORPAY_KEY_ID;
  const keySecret = envVars.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return { status: "missing", message: "Razorpay key ID and key secret are required" };
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders?count=1", {
      headers: { Authorization: `Basic ${auth}` },
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) return { status: "verified", message: "Razorpay credentials verified" };
    if (response.status === 401 || response.status === 403) {
      return { status: "invalid", message: "Razorpay rejected these credentials" };
    }
    return { status: "invalid", message: `Razorpay connection test returned HTTP ${response.status}` };
  } catch {
    return { status: "invalid", message: "Razorpay connection test could not reach the provider" };
  }
}

async function inspectGoogleOAuthConfiguration(
  projectId: string,
  environment: "development" | "preview" | "production",
): Promise<{ status: IntegrationStatus; message: string }> {
  const envVars = await resolveProjectRuntimeEnvVars({ projectId, environment });
  if (!envVars.GOOGLE_CLIENT_ID || !envVars.GOOGLE_CLIENT_SECRET) {
    return { status: "missing", message: "Google OAuth client ID and client secret are required" };
  }
  return {
    status: "configured",
    message: "Credentials saved. Complete Google sign-in to verify the OAuth callback.",
  };
}

async function testEmailIntegration(
  projectId: string,
  environment: "development" | "preview" | "production",
): Promise<{ status: IntegrationStatus; message: string }> {
  const activeProvider = await getActiveEmailProvider(projectId, environment);
  const envVars = await resolveProjectRuntimeEnvVars({ projectId, environment });
  const provider = getEmailProvider(activeProvider);

  const validation = provider.validateConfig(envVars);
  if (!validation.ok) {
    const isMissing = validation.issues.some((i) => i.includes("required"));
    return {
      status: isMissing ? "missing" : "invalid",
      message: validation.issues.join(", "),
    };
  }

  const result = await provider.testCredentials(envVars);
  return {
    status: result.ok ? "verified" : "invalid",
    message: result.message,
  };
}

export async function testIntegration(
  input: TestIntegrationInput,
): Promise<TestIntegrationResponse> {
  const { projectId, provider, environment } = input;

  let result: { status: IntegrationStatus; message: string };
  switch (provider) {
    case "mongodb":
      result = await testMongoIntegration(projectId, environment);
      break;
    case "auth":
      result = await testAuthIntegration(projectId, environment);
      break;
    case "cloudinary":
      result = await testCloudinaryIntegration(projectId, environment);
      break;
    case "email":
      result = await testEmailIntegration(projectId, environment);
      break;
    case "razorpay":
      result = await testRazorpayIntegration(projectId, environment);
      break;
    case "google-oauth":
      result = await inspectGoogleOAuthConfiguration(projectId, environment);
      break;
    default:
      result = { status: "invalid", message: `No connection test is implemented for ${provider}` };
      break;
  }

  return {
    provider,
    status: result.status,
    message: result.message,
    testedAt: new Date().toISOString(),
  };
}
