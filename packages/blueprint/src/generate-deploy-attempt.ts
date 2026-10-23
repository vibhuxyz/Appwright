import type { Runtime } from "@repo/agent-core";
import type { GeneratedAttempt } from "orchestrator";
import type { TaskDetail } from "./load-task-detail";

interface FeatureEnvVar {
  key: string;
  zodExpr: string;
  exampleValue: string;
}

const FEATURE_ENV_VARS: Record<string, FeatureEnvVar[]> = {
  auth: [{ key: "AUTH_SECRET", zodExpr: "z.string().min(1)", exampleValue: "change-me-to-a-random-secret" }],
  payments: [
    { key: "STRIPE_SECRET_KEY", zodExpr: "z.string().min(1)", exampleValue: "sk_test_..." },
    { key: "STRIPE_WEBHOOK_SECRET", zodExpr: "z.string().min(1)", exampleValue: "whsec_..." },
  ],
};

const HEALTH_ROUTE = `export function GET(): Response {
  return Response.json({ status: "ok" });
}
`;

function featureEnvVarsFor(features: readonly string[]): FeatureEnvVar[] {
  return features.flatMap((feature) => FEATURE_ENV_VARS[feature] ?? []);
}

function storesRecords(features: readonly string[], entityCount: number): boolean {
  return entityCount > 0 || features.some((feature) => feature === "auth" || feature === "payments");
}

function buildEnvSchemaFile(features: readonly string[], entityCount: number): string {
  const featureVars = featureEnvVarsFor(features);
  const database = storesRecords(features, entityCount);
  const extraFields = featureVars.map((envVar) => `  ${envVar.key}: ${envVar.zodExpr},`).join("\n");
  const extraPlaceholders = featureVars
    .map((envVar) => `  ${envVar.key}: "${envVar.exampleValue}",`)
    .join("\n");
  const mongoField = database
    ? "  MONGODB_URI: z.string().min(1),"
    : "  MONGODB_URI: z.string().min(1).optional(),";
  const mongoPlaceholder = database ? `  MONGODB_URI: "mongodb://localhost:27017/app",` : "";
  return `import { z } from "zod";

const EnvSchema = z.object({
${mongoField}
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
${extraFields}
});

const BUILD_PLACEHOLDERS = {
${mongoPlaceholder}
${extraPlaceholders}
};
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

export const env = EnvSchema.parse(isBuildPhase ? { ...BUILD_PLACEHOLDERS, ...process.env } : process.env);
`;
}

function buildEnvExampleFile(features: readonly string[], entityCount: number): string {
  const extraLines = featureEnvVarsFor(features)
    .map((envVar) => `${envVar.key}="${envVar.exampleValue}"`)
    .join("\n");
  const mongoLine = storesRecords(features, entityCount)
    ? `MONGODB_URI="mongodb://localhost:27017/app"\n`
    : "";
  return `${mongoLine}NEXT_PUBLIC_SITE_URL="http://localhost:3000"
${extraLines}
`;
}

export async function generateDeployAttempt(
  task: TaskDetail,
  runtime: Runtime,
): Promise<GeneratedAttempt> {
  const files = [
    { path: ".env.example", content: buildEnvExampleFile(task.features, task.entities.length) },
    { path: "src/env.ts", content: buildEnvSchemaFile(task.features, task.entities.length) },
    { path: "src/app/api/health/route.ts", content: HEALTH_ROUTE },
  ];

  await Promise.all(files.map((file) => runtime.writeFile(file.path, file.content)));

  return { kind: "completed", costCents: 0, writtenPaths: files.map((file) => file.path) };
}
