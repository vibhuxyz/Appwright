import type {
  DependencyManifest,
  PreflightCheckItem,
  PreflightCheckResponse,
} from "@repo/contracts";
import { checkRequiredIntegration, checkRuntimeIntegrationPreflight } from "../integrations";
import { resolveProjectRuntimeEnvVars } from "./environment-registry";
import { prisma } from "./prisma";

interface PreflightCheckInput {
  projectId: string;
  targetEnvironment: "development" | "preview" | "production";
}

function validateSiteUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function runDeploymentPreflight(
  input: PreflightCheckInput,
): Promise<PreflightCheckResponse> {
  const { projectId, targetEnvironment } = input;
  const checks: PreflightCheckItem[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      user: {
        select: { vercelConnection: true },
      },
      integrations: {
        include: { environments: true },
      },
      sessions: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          blueprints: {
            take: 1,
            orderBy: { blueprintVersion: "desc" },
            select: { dependencyManifest: true },
          },
        },
      },
    },
  });

  if (!project) {
    return {
      ok: false,
      targetEnvironment,
      errors: ["Project not found"],
      warnings: [],
      checks: [{ name: "project", status: "failed", message: "Project does not exist" }],
    };
  }

  const rawManifest = project.sessions[0]?.blueprints[0]?.dependencyManifest;
  const manifest = rawManifest ? (rawManifest as DependencyManifest) : null;

  if (!manifest) {
    checks.push({
      name: "manifest",
      status: "warning",
      message: "No dependency manifest found; using default checks",
    });
    warnings.push("No dependency manifest associated with project");
  } else {
    checks.push({
      name: "manifest",
      status: "passed",
      message: `Manifest v${manifest.manifestVersion} loaded (${manifest.framework})`,
    });
  }

  const envVars = await resolveProjectRuntimeEnvVars({
    projectId,
    environment: targetEnvironment,
  });

  if (manifest?.framework === "vite" && (
    manifest.email.required || manifest.storage.required ||
    manifest.externalApis.some((api) => api.name === "razorpay" && api.required)
  )) {
    checks.push({
      name: "integration_server_runtime",
      status: "failed",
      message: "This Vite project has no trusted server runtime for private integration credentials",
    });
    errors.push("Add a trusted server runtime before deploying required email, payment, or media integrations");
  }

  if (targetEnvironment === "production" && !project.user.vercelConnection) {
    checks.push({
      name: "vercel_connection",
      status: "failed",
      message: "User account is not connected to Vercel",
    });
    errors.push("Not connected to Vercel");
  } else if (targetEnvironment === "production") {
    checks.push({
      name: "vercel_connection",
      status: "passed",
      message: "Vercel authorization connected",
    });
  }

  const requiredKeys = manifest?.environments[targetEnvironment]?.requiredVars ?? [];
  for (const key of requiredKeys) {
    const integrationProvider = providerForEnvironmentKey(key);
    const hasConnectedConfiguration = integrationProvider !== null && project.integrations.some(
      (integration) => integration.provider === integrationProvider &&
        integration.environments.some((configuration) =>
          configuration.environment === targetEnvironment && configuration.status === "connected",
        ),
    );
    if (hasConnectedConfiguration) continue;
    const value = envVars[key];
    if (!value || !value.trim()) {
      checks.push({
        name: `env_${key}`,
        status: "failed",
        message: `Required environment variable ${key} is not set`,
      });
      errors.push(`Missing required variable: ${key}`);
    } else {
      checks.push({
        name: `env_${key}`,
        status: "passed",
        message: `Variable ${key} is configured`,
      });
    }
  }

  if (manifest?.database.required) {
    await checkRequiredIntegration({
      name: "mongodb_connectivity",
      provider: "mongodb",
      label: "Database",
      projectId,
      targetEnvironment,
      checks,
      errors,
    });
  }

  if (manifest?.auth.required) {
    await checkRequiredIntegration({
      name: "auth_configuration",
      provider: "auth",
      label: "Authentication",
      projectId,
      targetEnvironment,
      checks,
      errors,
    });
  }

  if (manifest?.email?.required) {
    await checkRequiredIntegration({
      name: "email_configuration",
      provider: "email",
      label: "Email delivery",
      projectId,
      targetEnvironment,
      checks,
      errors,
    });
  }

  const runtimePreflight = await checkRuntimeIntegrationPreflight({
    projectId,
    targetEnvironment,
    integrations: project.integrations,
  });
  checks.push(...runtimePreflight.checks);
  errors.push(...runtimePreflight.errors);
  warnings.push(...runtimePreflight.warnings);

  if (targetEnvironment === "production" && envVars.NEXT_PUBLIC_SITE_URL) {
    const urlValid = validateSiteUrl(envVars.NEXT_PUBLIC_SITE_URL);
    if (!urlValid) {
      checks.push({
        name: "site_url",
        status: "failed",
        message: `NEXT_PUBLIC_SITE_URL "${envVars.NEXT_PUBLIC_SITE_URL}" is invalid`,
      });
      errors.push("NEXT_PUBLIC_SITE_URL must be a valid HTTP or HTTPS URL");
    } else {
      checks.push({
        name: "site_url",
        status: "passed",
        message: `NEXT_PUBLIC_SITE_URL verified: ${envVars.NEXT_PUBLIC_SITE_URL}`,
      });
    }
  }

  return {
    ok: errors.length === 0,
    targetEnvironment,
    errors,
    warnings,
    checks,
  };
}

function providerForEnvironmentKey(key: string): string | null {
  if (key === "BREVO_API_KEY" || key === "EMAIL_FROM") return "email";
  if (key.startsWith("CLOUDINARY_")) return "cloudinary";
  if (key.startsWith("RAZORPAY_")) return "razorpay";
  if (key.startsWith("GOOGLE_")) return "google-oauth";
  return null;
}
