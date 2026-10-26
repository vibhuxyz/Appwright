import { describe, expect, it } from "bun:test";
import { prisma } from "../src/lib/prisma";
import { setProjectEnvironmentVariable } from "../src/lib/environment-registry";
import { runDeploymentPreflight } from "../src/lib/preflight-check";

describe("Deployment Preflight", () => {
  it("fails preflight when MongoDB is required but not configured", async () => {
    const user = await prisma.user.create({
      data: {
        email: `preflight-user-${Date.now()}@example.com`,
        hashPassword: "password123",
      },
    });

    const project = await prisma.project.create({
      data: {
        name: "Test Preflight",
        workspacePath: "/tmp/preflight",
        userId: user.id,
      },
    });

    const session = await prisma.session.create({
      data: {
        projectId: project.id,
      },
    });

    await prisma.blueprint.create({
      data: {
        sessionId: session.id,
        blueprintVersion: 1,
        intent: {},
        stack: { db: "mongodb", framework: "next" },
        entities: [{ name: "Item", fields: [] }],
        pages: [{ route: "/", purpose: "home" }],
        features: ["auth"],
        theme: { preset: "default", primary: "#000000" },
        dependencyManifest: {
          manifestVersion: 1,
          projectId: project.id,
          framework: "nextjs",
          runtime: "nodejs",
          database: { provider: "mongodb", required: true, orm: "mongoose" },
          auth: { provider: "authjs", required: true, features: ["credentials"] },
          storage: { provider: "none", required: false, capabilities: [] },
          email: { provider: "none", required: false },
          realtime: { provider: "none", required: false },
          externalApis: [],
          envVars: [
            {
              key: "MONGODB_URI",
              description: "Database",
              required: true,
              isSecret: true,
              scopes: ["development", "preview", "production"],
            },
            {
              key: "AUTH_SECRET",
              description: "Auth",
              required: true,
              isSecret: true,
              scopes: ["development", "preview", "production"],
            },
          ],
          environments: {
            development: { requiredVars: ["MONGODB_URI", "AUTH_SECRET"] },
            preview: { requiredVars: ["MONGODB_URI", "AUTH_SECRET"] },
            production: { requiredVars: ["MONGODB_URI", "AUTH_SECRET"] },
          },
          build: { command: "bun run build", outputDir: ".next", nodeVersion: "20.x" },
        },
      },
    });

    const resultDev = await runDeploymentPreflight({
      projectId: project.id,
      targetEnvironment: "development",
    });

    expect(resultDev.ok).toBe(false);
    expect(resultDev.errors.length).toBeGreaterThan(0);
    expect(resultDev.checks.some((c) => c.status === "failed")).toBe(true);

    const mongoUri = process.env.MONGO_DB_PROJECT_DATABASE ?? "mongodb://localhost:27017/test-preflight";
    await setProjectEnvironmentVariable({
      projectId: project.id,
      environment: "development",
      key: "MONGODB_URI",
      value: mongoUri,
      isSecret: true,
    });
    await setProjectEnvironmentVariable({
      projectId: project.id,
      environment: "development",
      key: "AUTH_SECRET",
      value: "super-strong-auth-secret-12345",
      isSecret: true,
    });

    const resultDevAfter = await runDeploymentPreflight({
      projectId: project.id,
      targetEnvironment: "development",
    });

    expect(resultDevAfter.ok).toBe(true);
    expect(resultDevAfter.errors.length).toBe(0);

    await prisma.user.delete({ where: { id: user.id } });
  });

  it("passes preflight for a static app that requires neither database nor auth", async () => {
    const user = await prisma.user.create({
      data: {
        email: `preflight-static-${Date.now()}@example.com`,
        hashPassword: "password123",
      },
    });

    const project = await prisma.project.create({
      data: {
        name: "Static App",
        workspacePath: "/tmp/static",
        userId: user.id,
      },
    });

    const session = await prisma.session.create({
      data: {
        projectId: project.id,
      },
    });

    await prisma.blueprint.create({
      data: {
        sessionId: session.id,
        blueprintVersion: 1,
        intent: {},
        stack: { db: "none", framework: "vite" },
        entities: [],
        pages: [{ route: "/", purpose: "home" }],
        features: [],
        theme: { preset: "default", primary: "#000000" },
        dependencyManifest: {
          manifestVersion: 1,
          projectId: project.id,
          framework: "vite",
          runtime: "nodejs",
          database: { provider: "none", required: false, orm: "none" },
          auth: { provider: "none", required: false, features: [] },
          storage: { provider: "none", required: false, capabilities: [] },
          email: { provider: "none", required: false },
          realtime: { provider: "none", required: false },
          externalApis: [],
          envVars: [],
          environments: {
            development: { requiredVars: [] },
            preview: { requiredVars: [] },
            production: { requiredVars: [] },
          },
          build: { command: "bun run build", outputDir: "dist", nodeVersion: "20.x" },
        },
      },
    });

    const result = await runDeploymentPreflight({
      projectId: project.id,
      targetEnvironment: "development",
    });

    expect(result.ok).toBe(true);
    expect(result.errors.length).toBe(0);

    await prisma.user.delete({ where: { id: user.id } });
  });
});
