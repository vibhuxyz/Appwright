import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { setProjectEnvironmentVariable } from "../src/lib/environment-registry";
import { runDeploymentPreflight } from "../src/lib/preflight-check";
import { prisma } from "../src/lib/prisma";

let projectId = "";
let userId = "";

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email: `google-preflight-${crypto.randomUUID()}@example.com`,
      hashPassword: "test-password",
    },
  });
  userId = user.id;
  const project = await prisma.project.create({
    data: {
      name: "Google OAuth Preflight",
      workspacePath: `/tmp/google-preflight-${crypto.randomUUID()}`,
      userId,
    },
  });
  projectId = project.id;
  const session = await prisma.session.create({ data: { projectId } });
  await prisma.blueprint.create({
    data: {
      sessionId: session.id,
      blueprintVersion: 1,
      intent: {},
      stack: { framework: "next", db: "none" },
      entities: [],
      pages: [{ route: "/", purpose: "Sign-in" }],
      features: ["auth", "google-oauth"],
      theme: { preset: "default", primary: "#000000" },
      dependencyManifest: googleManifest(projectId),
    },
  });
  await prisma.projectIntegration.create({
    data: {
      projectId,
      provider: "google-oauth",
      required: true,
      status: "configured",
      environments: {
        create: { environment: "development", credentialMode: "BYOK", status: "configured" },
      },
    },
  });
  await setGoogleCredentials(projectId);
});

afterAll(async () => {
  if (projectId) await prisma.project.delete({ where: { id: projectId } });
  if (userId) await prisma.user.delete({ where: { id: userId } });
});

describe("Google OAuth deployment preflight", () => {
  it("allows configured BYOK credentials and requires a live sign-in after deployment", async () => {
    const result = await runDeploymentPreflight({ projectId, targetEnvironment: "development" });
    const oauthCheck = result.checks.find((check) => check.name === "google-oauth_connectivity");

    expect(result.ok).toBe(true);
    expect(oauthCheck?.status).toBe("passed");
    expect(oauthCheck?.message).toContain("Verify the callback with a real sign-in");
    expect(result.warnings).toContain("Google OAuth sign-in must be verified after deployment");
  });
});

function googleManifest(projectIdValue: string) {
  const envVars = [
    { key: "AUTH_SECRET", description: "Auth session secret", required: true, isSecret: true, scopes: ["development", "preview", "production"] },
    { key: "GOOGLE_CLIENT_ID", description: "OAuth client ID", required: true, isSecret: false, scopes: ["development", "preview", "production"] },
    { key: "GOOGLE_CLIENT_SECRET", description: "OAuth client secret", required: true, isSecret: true, scopes: ["development", "preview", "production"] },
  ];
  const requiredVars = envVars.map((variable) => variable.key);
  return {
    manifestVersion: 1,
    projectId: projectIdValue,
    framework: "nextjs",
    runtime: "nodejs",
    database: { provider: "none", required: false, orm: "none" },
    auth: { provider: "authjs", required: true, features: ["google-oauth"] },
    storage: { provider: "none", required: false, capabilities: [] },
    email: { provider: "none", required: false },
    realtime: { provider: "none", required: false },
    externalApis: [],
    envVars,
    environments: {
      development: { requiredVars },
      preview: { requiredVars },
      production: { requiredVars },
    },
    build: { command: "bun run build", outputDir: ".next", nodeVersion: "20.x" },
  };
}

async function setGoogleCredentials(targetProjectId: string) {
  await Promise.all([
    setProjectEnvironmentVariable({
      projectId: targetProjectId,
      environment: "development",
      key: "AUTH_SECRET",
      value: "preflight-auth-secret-0123456789",
      isSecret: true,
    }),
    setProjectEnvironmentVariable({
      projectId: targetProjectId,
      environment: "development",
      key: "GOOGLE_CLIENT_ID",
      value: "preflight.apps.googleusercontent.com",
    }),
    setProjectEnvironmentVariable({
      projectId: targetProjectId,
      environment: "development",
      key: "GOOGLE_CLIENT_SECRET",
      value: "preflight-google-client-secret",
      isSecret: true,
    }),
  ]);
}
