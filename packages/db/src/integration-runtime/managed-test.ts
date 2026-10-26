import {
  isManagedCredentialAllowed,
  type IntegrationEnvironment,
  type IntegrationProvider,
  type IntegrationStatus,
} from "@repo/contracts";
import { mongoDatabaseProvider } from "../lib/database-provider";
import { getProjectRuntimeMongoUri } from "../lib/project-database-env";
import { ProjectDatabaseError } from "../lib/project-database-errors";
import { managedCredentials, type ManagedCredentials } from "./managed-credentials";

const PROVIDER_TEST_TIMEOUT_MS = 5000;

export interface ManagedTestResult {
  status: IntegrationStatus;
  message: string;
}

async function probe(url: string, headers: Record<string, string>): Promise<boolean | null> {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(PROVIDER_TEST_TIMEOUT_MS) });
    return response.ok;
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "TypeError")) return null;
    throw error;
  }
}

function basicAuth(user: string, password: string): Record<string, string> {
  return { Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}` };
}

function probeResult(isOk: boolean | null, label: string): ManagedTestResult {
  if (isOk === null) return { status: "invalid", message: `Appwright ${label} test connection could not reach the provider.` };
  return isOk
    ? { status: "verified", message: `Appwright ${label} test connection verified.` }
    : { status: "invalid", message: `Appwright ${label} test credentials were rejected.` };
}

async function testManagedMongo(projectId: string, environment: IntegrationEnvironment): Promise<ManagedTestResult> {
  try {
    const uri = await getProjectRuntimeMongoUri({ projectId, environment });
    const result = await mongoDatabaseProvider.testConnection(uri);
    return { status: result.ok ? "verified" : "invalid", message: result.message };
  } catch (error) {
    if (!(error instanceof ProjectDatabaseError && error.code === "NOT_READY")) throw error;
    return environment === "production"
      ? { status: "configured", message: "The Appwright database is created on first deploy." }
      : { status: "missing", message: `The Appwright ${environment} database is not provisioned yet.` };
  }
}

async function testCredentials(credentials: ManagedCredentials): Promise<ManagedTestResult> {
  switch (credentials.provider) {
    case "email":
      return probeResult(await probe("https://api.brevo.com/v3/account", { "api-key": credentials.apiKey }), "Brevo");
    case "razorpay":
      return probeResult(
        await probe("https://api.razorpay.com/v1/orders?count=1", basicAuth(credentials.keyId, credentials.keySecret)),
        "Razorpay",
      );
    case "cloudinary":
      return probeResult(
        await probe(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/ping`, basicAuth(credentials.apiKey, credentials.apiSecret)),
        "Cloudinary",
      );
    case "mongodb":
      return { status: "missing", message: "The Appwright database is tested per project." };
    default: {
      const unhandled: never = credentials;
      return unhandled;
    }
  }
}

export async function testManagedIntegration(input: {
  projectId: string;
  provider: IntegrationProvider;
  environment: IntegrationEnvironment;
}): Promise<ManagedTestResult> {
  if (!isManagedCredentialAllowed(input.provider, input.environment)) {
    return {
      status: "production_configuration_required",
      message: "Appwright test keys are limited to development and preview. Production needs your own provider account.",
    };
  }
  const credentials = managedCredentials(input.provider);
  if (!credentials) {
    return { status: "missing", message: "Appwright test keys are not enabled for this integration." };
  }
  if (credentials.provider === "mongodb") return testManagedMongo(input.projectId, input.environment);
  return testCredentials(credentials);
}
