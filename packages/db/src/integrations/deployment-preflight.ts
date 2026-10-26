import type { PreflightCheckItem } from "@repo/contracts";
import { prisma, testIntegration } from "../lib";
import { testManagedIntegration } from "../integration-runtime";
import { getIntegrationUsageSummary } from "./usage-summary";

interface RuntimeIntegration {
  provider: string;
  required: boolean;
  environments: readonly { environment: string; credentialMode: string }[];
}

function isDatabaseCreatedOnDeploy(provider: string, status: string): boolean {
  return provider === "mongodb" && status === "configured";
}

export interface RuntimeIntegrationPreflightResult {
  checks: PreflightCheckItem[];
  errors: string[];
  warnings: string[];
}

export async function checkRequiredIntegration(input: {
  name: string;
  provider: "mongodb" | "auth" | "email";
  label: string;
  projectId: string;
  targetEnvironment: "development" | "preview" | "production";
  checks: PreflightCheckItem[];
  errors: string[];
}): Promise<void> {
  if (input.provider === "email") {
    const configured = await prisma.projectIntegrationEnvironment.findFirst({
      where: {
        environment: input.targetEnvironment,
        integration: { projectId: input.projectId, provider: "email" },
      },
      select: { credentialMode: true },
    });
    if (configured?.credentialMode === "APPWRITE_MANAGED") {
      await checkManagedEmail(input);
      return;
    }
  }
  const test = await testIntegration({
    projectId: input.projectId,
    provider: input.provider,
    environment: input.targetEnvironment,
  });
  if (test.status === "verified" || isDatabaseCreatedOnDeploy(input.provider, test.status)) {
    input.checks.push({ name: input.name, status: "passed", message: test.message });
    return;
  }
  input.checks.push({ name: input.name, status: "failed", message: test.message });
  input.errors.push(`${input.label} check failed: ${test.message}`);
}

export async function checkRuntimeIntegrationPreflight(input: {
  projectId: string;
  targetEnvironment: "development" | "preview" | "production";
  integrations: readonly RuntimeIntegration[];
}): Promise<RuntimeIntegrationPreflightResult> {
  const result: RuntimeIntegrationPreflightResult = { checks: [], errors: [], warnings: [] };
  const integrations = input.integrations.filter((integration) =>
    integration.required && isRuntimeProvider(integration.provider),
  );
  if (integrations.length === 0) return result;
  const usage = await getIntegrationUsageSummary(input.projectId);

  for (const integration of integrations) {
    const provider = integration.provider;
    if (!isRuntimeProvider(provider)) continue;
    await checkIntegration({ ...input, integration, provider, usage, result });
  }
  return result;
}

async function checkIntegration(input: {
  projectId: string;
  targetEnvironment: "development" | "preview" | "production";
  integration: RuntimeIntegration;
  provider: "razorpay" | "google-oauth" | "cloudinary";
  usage: Awaited<ReturnType<typeof getIntegrationUsageSummary>>;
  result: RuntimeIntegrationPreflightResult;
}): Promise<void> {
  const { integration, provider, targetEnvironment, result } = input;
  const label = provider === "google-oauth" ? "Google OAuth" : provider;
  const configuration = integration.environments.find((item) => item.environment === targetEnvironment);
  if (!configuration) {
    failConfiguration(result, provider, label, `${label} is not configured for ${targetEnvironment}`);
    return;
  }
  if (configuration.credentialMode === "APPWRITE_MANAGED") {
    await checkManagedIntegration(input, label);
    return;
  }
  const test = await testIntegration({ projectId: input.projectId, provider, environment: targetEnvironment });
  const isConfiguredGoogle = provider === "google-oauth" && test.status === "configured";
  const isPassed = test.status === "verified" || isConfiguredGoogle;
  const message = isConfiguredGoogle
    ? `${test.message} Verify the callback with a real sign-in after deployment.`
    : test.message;
  result.checks.push({ name: `${provider}_connectivity`, status: isPassed ? "passed" : "failed", message });
  if (isConfiguredGoogle) result.warnings.push(`${label} sign-in must be verified after deployment`);
  if (!isPassed) result.errors.push(`${label} check failed: ${test.message}`);
}

async function checkManagedIntegration(
  input: Parameters<typeof checkIntegration>[0],
  label: string,
): Promise<void> {
  const { provider, targetEnvironment, usage, result } = input;
  if (targetEnvironment === "production") {
    failConfiguration(result, provider, label, `${label} requires your own provider credentials in production`);
    return;
  }
  const quota = usage.find((item) => item.provider === provider);
  if (quota?.remaining === 0) {
    failConfiguration(result, provider, label, `${label} managed allowance is exhausted`);
    return;
  }
  const test = await testManagedIntegration({ projectId: input.projectId, provider, environment: targetEnvironment });
  result.checks.push({
    name: `${provider}_connectivity`,
    status: test.status === "verified" ? "passed" : "failed",
    message: test.message,
  });
  if (test.status !== "verified") result.errors.push(`${label} check failed: ${test.message}`);
}

async function checkManagedEmail(input: {
  name: string;
  label: string;
  projectId: string;
  targetEnvironment: "development" | "preview" | "production";
  checks: PreflightCheckItem[];
  errors: string[];
}): Promise<void> {
  const quota = (await getIntegrationUsageSummary(input.projectId)).find((item) => item.provider === "email");
  const test = await testManagedIntegration({
    projectId: input.projectId,
    provider: "email",
    environment: input.targetEnvironment,
  });
  const message = input.targetEnvironment === "production"
    ? "Production email requires your own Brevo account"
    : quota?.remaining === 0
      ? "Appwrite-managed Brevo allowance is exhausted"
      : test.message;
  if (input.targetEnvironment !== "production" && quota && quota.remaining > 0 && test.status === "verified") {
    input.checks.push({ name: input.name, status: "passed", message: test.message });
    return;
  }
  input.checks.push({ name: input.name, status: "failed", message });
  input.errors.push(`${input.label} check failed: ${message}`);
}

function failConfiguration(
  result: RuntimeIntegrationPreflightResult,
  provider: string,
  label: string,
  message: string,
): void {
  result.checks.push({ name: `${provider}_configuration`, status: "failed", message });
  result.errors.push(`${label} ${message}`);
}

function isRuntimeProvider(provider: string): provider is "razorpay" | "google-oauth" | "cloudinary" {
  return provider === "razorpay" || provider === "google-oauth" || provider === "cloudinary";
}
