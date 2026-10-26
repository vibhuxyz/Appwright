import {
  DependencyManifestSchema,
  type DependencyManifest,
  type ExternalApiRequirement,
} from "@repo/contracts";
import { buildEnvVars } from "./build-env-vars";
import {
  DEFAULT_NODE_VERSION,
  NEXTJS_BUILD_COMMAND,
  NEXTJS_OUTPUT_DIR,
  SITE_URL_KEY,
  VITE_BUILD_COMMAND,
  VITE_OUTPUT_DIR,
} from "./constants";
import type { GenerateManifestInput } from "./types";

function hasFeature(features: readonly string[], target: string): boolean {
  return features.includes(target);
}

function resolveDatabaseRequirement(
  features: readonly string[],
  entityCount: number,
  stackDb: string,
) {
  const needsDb =
    stackDb === "mongodb" &&
    (entityCount > 0 ||
      hasFeature(features, "auth") ||
      hasFeature(features, "payments") ||
      hasFeature(features, "database") ||
      hasFeature(features, "admin"));
  return {
    provider: (needsDb ? "mongodb" : "none") as "mongodb" | "none",
    required: needsDb,
    orm: (needsDb ? "mongoose" : "none") as "mongoose" | "none",
  };
}

function resolveStorageRequirement(
  features: readonly string[],
  requirements: readonly { area: string; level: string }[] | undefined,
) {
  const needsStorage =
    hasFeature(features, "media") ||
    hasFeature(features, "fileUpload") ||
    hasFeature(features, "assets") ||
    Boolean(requirements?.some((r) => r.area === "media" && r.level === "required"));

  return {
    provider: (needsStorage ? "cloudinary" : "none") as "cloudinary" | "none",
    required: needsStorage,
    capabilities: needsStorage ? ["image-uploads", "cdn-delivery"] : [],
  };
}



export function generateDependencyManifest(
  input: GenerateManifestInput,
): DependencyManifest {
  const { projectId, blueprint, templateId } = input;
  const isVite = templateId === "vite-react";
  const features = blueprint.features ?? [];
  const entityCount = blueprint.entities?.length ?? 0;

  const database = resolveDatabaseRequirement(
    features,
    entityCount,
    blueprint.stack.db,
  );

  const authRequired = hasFeature(features, "auth") ||
    hasFeature(features, "accounts") ||
    hasFeature(features, "google-oauth");
  const auth = {
    provider: (authRequired ? "authjs" : "none") as "authjs" | "none",
    required: authRequired,
    features: authRequired
      ? ["credentials", "session", ...(hasFeature(features, "google-oauth") ? ["google-oauth"] : [])]
      : [],
  };

  const storage = resolveStorageRequirement(features, blueprint.requirements);
  const emailRequired = hasFeature(features, "email") || hasFeature(features, "notifications");
  const emailProvider = input.emailProvider === "nodemailer" ? "nodemailer" : "brevo";
  const realtimeRequired = hasFeature(features, "realtime") || hasFeature(features, "websockets");
  const paymentsRequired = hasFeature(features, "payments");

  const externalApis: ExternalApiRequirement[] = [];
  if (paymentsRequired) {
    externalApis.push({
      name: "razorpay",
      required: true,
      description: "Payment processing integration",
    });
  }

  const envVars = buildEnvVars({
    dbRequired: database.required,
    authRequired,
    googleOAuthRequired: hasFeature(features, "google-oauth"),
    storageRequired: storage.required,
    emailRequired,
    emailProvider,
    paymentsRequired,
  });

  const requiredKeys = envVars.filter((v) => v.required).map((v) => v.key);
  const prodRequiredKeys = [
    ...requiredKeys,
    SITE_URL_KEY,
  ];

  const build = isVite
    ? {
        command: VITE_BUILD_COMMAND,
        outputDir: VITE_OUTPUT_DIR,
        nodeVersion: DEFAULT_NODE_VERSION,
      }
    : {
        command: NEXTJS_BUILD_COMMAND,
        outputDir: NEXTJS_OUTPUT_DIR,
        nodeVersion: DEFAULT_NODE_VERSION,
      };

  return DependencyManifestSchema.parse({
    manifestVersion: 1,
    projectId,
    framework: isVite ? "vite" : "nextjs",
    runtime: "nodejs",
    database,
    auth,
    storage,
    email: {
      provider: emailRequired ? emailProvider : "none",
      required: emailRequired,
    },
    realtime: {
      provider: realtimeRequired ? "websockets" : "none",
      required: realtimeRequired,
    },
    externalApis,
    envVars,
    environments: {
      development: { requiredVars: requiredKeys },
      preview: { requiredVars: requiredKeys },
      production: { requiredVars: prodRequiredKeys },
    },
    build,
  });
}
