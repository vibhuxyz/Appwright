import { describe, expect, it } from "bun:test";
import type { DependencyManifest } from "@repo/contracts";
import { prisma } from "../src/lib/prisma";
import {
  deleteProjectEnvironmentVariable,
  getEnvironmentOverview,
  resolveProjectRuntimeEnvVars,
  setProjectEnvironmentVariable,
  syncManifestToRegistry,
} from "../src/lib/environment-registry";

function sampleManifest(projectId: string): DependencyManifest {
  return {
    manifestVersion: 1,
    projectId,
    framework: "nextjs",
    runtime: "nodejs",
    database: { provider: "mongodb", required: true, orm: "mongoose" },
    auth: { provider: "authjs", required: true, features: ["credentials"] },
    storage: { provider: "cloudinary", required: true, capabilities: ["image-uploads"] },
    email: { provider: "none", required: false },
    realtime: { provider: "none", required: false },
    externalApis: [],
    envVars: [
      {
        key: "MONGODB_URI",
        description: "MongoDB connection URI",
        required: true,
        isSecret: true,
        scopes: ["development", "preview", "production"],
      },
      {
        key: "AUTH_SECRET",
        description: "Auth session secret",
        required: true,
        isSecret: true,
        scopes: ["development", "preview", "production"],
      },
      {
        key: "NEXT_PUBLIC_SITE_URL",
        description: "Canonical site URL",
        required: false,
        isSecret: false,
        scopes: ["development", "preview", "production"],
      },
    ],
    environments: {
      development: { requiredVars: ["MONGODB_URI", "AUTH_SECRET"] },
      preview: { requiredVars: ["MONGODB_URI", "AUTH_SECRET"] },
      production: { requiredVars: ["MONGODB_URI", "AUTH_SECRET", "NEXT_PUBLIC_SITE_URL"] },
    },
    build: {
      command: "bun run build",
      outputDir: ".next",
      nodeVersion: "20.x",
    },
  };
}

describe("Environment Registry", () => {
  it("syncs manifest, sets variables, masks secrets, and isolates projects", async () => {
    const user = await prisma.user.create({
      data: {
        email: `env-test-${Date.now()}@example.com`,
        hashPassword: "password123",
      },
    });

    const projectA = await prisma.project.create({
      data: {
        name: "Project A",
        workspacePath: "/tmp/proja",
        userId: user.id,
      },
    });

    const projectB = await prisma.project.create({
      data: {
        name: "Project B",
        workspacePath: "/tmp/projb",
        userId: user.id,
      },
    });

    const manifestA = sampleManifest(projectA.id);
    await syncManifestToRegistry(projectA.id, manifestA);

    await setProjectEnvironmentVariable({
      projectId: projectA.id,
      environment: "production",
      key: "AUTH_SECRET",
      value: "super-secret-auth-key-123456",
      isSecret: true,
    });

    await setProjectEnvironmentVariable({
      projectId: projectA.id,
      environment: "production",
      key: "NEXT_PUBLIC_SITE_URL",
      value: "https://my-app.vercel.app",
      isSecret: false,
    });

    await setProjectEnvironmentVariable({
      projectId: projectA.id,
      environment: "all",
      key: "REGISTRY_TEST_KEY",
      value: "shared-value",
    });
    await setProjectEnvironmentVariable({
      projectId: projectA.id,
      environment: "development",
      key: "REGISTRY_TEST_KEY",
      value: "development-value",
    });
    await setProjectEnvironmentVariable({
      projectId: projectA.id,
      environment: "development",
      key: "REGISTRY_TEST_SECRET",
      value: "replace-this-secret",
      isSecret: true,
    });
    await setProjectEnvironmentVariable({
      projectId: projectA.id,
      environment: "development",
      key: "REGISTRY_TEST_SECRET",
      value: "public-value",
    });

    const { overview: overviewA } = await getEnvironmentOverview({
      projectId: projectA.id,
      environment: "production",
    });
    const authVar = overviewA.variables.find(
      (v) => v.key === "AUTH_SECRET" && v.environment === "production",
    );
    expect(authVar).toBeDefined();
    expect(authVar?.value).toBeNull();
    expect(authVar?.isSecret).toBe(true);
    expect(authVar?.maskedValue).toContain("••••");
    expect(authVar?.maskedValue).not.toBe("super-secret-auth-key-123456");

    const siteVar = overviewA.variables.find(
      (v) => v.key === "NEXT_PUBLIC_SITE_URL" && v.environment === "production",
    );
    expect(siteVar?.value).toBe("https://my-app.vercel.app");
    expect(siteVar?.isSecret).toBe(false);
    expect(overviewA.variables.some((v) => v.environment === "development")).toBe(false);
    expect(overviewA.variables.some((v) => v.key === "MONGODB_URI")).toBe(false);
    expect(overviewA.database.source).toBe("NOT_PROVISIONED");

    const { overview: developmentOverview } = await getEnvironmentOverview({
      projectId: projectA.id,
      environment: "development",
    });
    const developmentKey = developmentOverview.variables.find((v) => v.key === "REGISTRY_TEST_KEY");
    expect(developmentKey?.value).toBe("development-value");
    expect(developmentKey?.environment).toBe("development");

    const runtimeVarsA = await resolveProjectRuntimeEnvVars({
      projectId: projectA.id,
      environment: "production",
    });
    expect(runtimeVarsA.AUTH_SECRET).toBe("super-secret-auth-key-123456");
    expect(runtimeVarsA.NEXT_PUBLIC_SITE_URL).toBe("https://my-app.vercel.app");

    const runtimeVarsDevelopment = await resolveProjectRuntimeEnvVars({
      projectId: projectA.id,
      environment: "development",
    });
    expect(runtimeVarsDevelopment.REGISTRY_TEST_KEY).toBe("development-value");
    expect(runtimeVarsDevelopment.REGISTRY_TEST_SECRET).toBe("public-value");
    expect(
      await prisma.secret.findUnique({
        where: {
          projectId_key: {
            projectId: projectA.id,
            key: "development:REGISTRY_TEST_SECRET",
          },
        },
      }),
    ).toBeNull();

    const runtimeVarsB = await resolveProjectRuntimeEnvVars({
      projectId: projectB.id,
      environment: "production",
    });
    expect(runtimeVarsB.AUTH_SECRET).toBeUndefined();
    expect(runtimeVarsB.NEXT_PUBLIC_SITE_URL).toBeUndefined();

    await deleteProjectEnvironmentVariable({
      projectId: projectA.id,
      environment: "production",
      key: "AUTH_SECRET",
    });

    const runtimeVarsAfterDelete = await resolveProjectRuntimeEnvVars({
      projectId: projectA.id,
      environment: "production",
    });
    expect(runtimeVarsAfterDelete.AUTH_SECRET).toBeUndefined();

    await prisma.user.delete({ where: { id: user.id } });
  });
});
