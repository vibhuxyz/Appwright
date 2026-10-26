import { describe, expect, it } from "bun:test";
import express from "express";
import type { Server } from "node:http";
import { prisma } from "@repo/db";
import { environmentRouter } from "../src/routes/environment";
import { environmentTestRouter } from "../src/routes/environment-tests";
import { vercelRouter } from "../src/routes/vercel";

interface TestContext {
  server: Server;
  baseUrl: string;
  user: { id: string; email: string };
  project: { id: string; name: string };
}

async function setupTestApp(): Promise<TestContext> {
  const user = await prisma.user.create({
    data: {
      email: `route-test-${Date.now()}@example.com`,
      hashPassword: "password123",
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "API Test Project",
      templateId: "nextjs-fullstack",
      workspacePath: "/tmp/api-test",
      userId: user.id,
    },
  });

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.userId = user.id;
    next();
  });
  app.use(environmentRouter);
  app.use(environmentTestRouter);
  app.use(vercelRouter);

  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    user,
    project,
  };
}

async function teardownTestApp(ctx: TestContext): Promise<void> {
  await new Promise<void>((resolve) => {
    try {
      ctx.server.closeAllConnections?.();
      ctx.server.close(() => resolve());
    } catch {
      resolve();
    }
  });
  await prisma.user.delete({ where: { id: ctx.user.id } });
}

describe("Environment and Deployment Routes", () => {
  it("manages environment variables, masks secrets, and runs preflight checks", async () => {
    const ctx = await setupTestApp();
    try {
      const getRes = await fetch(`${ctx.baseUrl}/v1/projects/${ctx.project.id}/environment`);
      expect(getRes.status).toBe(200);
      const overview = (await getRes.json()) as {
        projectId: string;
        variables: { key: string }[];
      };
      expect(overview.projectId).toBe(ctx.project.id);

      const setSecretRes = await fetch(
        `${ctx.baseUrl}/v1/projects/${ctx.project.id}/environment/variables`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            environment: "development",
            key: "AUTH_SECRET",
            value: "super-secret-key-that-is-very-long",
            isSecret: true,
            description: "Auth session secret",
          }),
        },
      );
      expect(setSecretRes.status).toBe(200);

      const overviewAfterSetRes = await fetch(
        `${ctx.baseUrl}/v1/projects/${ctx.project.id}/environment`,
      );
      const overviewAfterSet = (await overviewAfterSetRes.json()) as {
        variables: { key: string; value: string | null; maskedValue: string }[];
      };
      const authVar = overviewAfterSet.variables.find((v) => v.key === "AUTH_SECRET");
      expect(authVar).toBeDefined();
      expect(authVar?.value).toBeNull();
      expect(authVar?.maskedValue).toContain("••••");

      const testRes = await fetch(
        `${ctx.baseUrl}/v1/projects/${ctx.project.id}/environment/test-integration`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "auth",
            environment: "development",
          }),
        },
      );
      expect(testRes.status).toBe(200);
      const testResult = (await testRes.json()) as { status: string };
      expect(testResult.status).toBe("connected");

      const productionRes = await fetch(
        `${ctx.baseUrl}/v1/projects/${ctx.project.id}/environment?environment=production`,
      );
      const productionOverview = (await productionRes.json()) as {
        environment: string;
        variables: { key: string }[];
        integrations: { provider: string; status: string }[];
      };
      expect(productionOverview.environment).toBe("production");
      expect(productionOverview.variables.some((v) => v.key === "AUTH_SECRET")).toBe(false);
      expect(productionOverview.integrations.find((i) => i.provider === "auth")?.status).not.toBe("connected");

      const missingEnvironmentRes = await fetch(
        `${ctx.baseUrl}/v1/projects/${ctx.project.id}/environment/variables`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "SITE_NAME", value: "Example" }),
        },
      );
      expect(missingEnvironmentRes.status).toBe(400);

      const preflightRes = await fetch(
        `${ctx.baseUrl}/v1/projects/${ctx.project.id}/environment/preflight`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetEnvironment: "development" }),
        },
      );
      expect(preflightRes.status).toBe(200);
      const preflight = (await preflightRes.json()) as {
        ok: boolean;
        checks: { name: string }[];
      };
      expect(Array.isArray(preflight.checks)).toBe(true);

      const deleteRes = await fetch(
        `${ctx.baseUrl}/v1/projects/${ctx.project.id}/environment/variables?environment=development&key=AUTH_SECRET`,
        { method: "DELETE" },
      );
      expect(deleteRes.status).toBe(204);

      const overviewAfterDelRes = await fetch(
        `${ctx.baseUrl}/v1/projects/${ctx.project.id}/environment`,
      );
      const overviewAfterDel = (await overviewAfterDelRes.json()) as {
        variables: { key: string }[];
      };
      expect(overviewAfterDel.variables.some((v) => v.key === "AUTH_SECRET")).toBe(false);
    } finally {
      await teardownTestApp(ctx);
    }
  });

  it("enforces cross-project authorization on environment endpoints", async () => {
    const ctx = await setupTestApp();
    try {
      const otherUser = await prisma.user.create({
        data: {
          email: `other-user-${Date.now()}@example.com`,
          hashPassword: "password123",
        },
      });
      const otherProject = await prisma.project.create({
        data: {
          name: "Other Project",
          workspacePath: "/tmp/other",
          userId: otherUser.id,
        },
      });

      const res = await fetch(`${ctx.baseUrl}/v1/projects/${otherProject.id}/environment`);
      expect(res.status).toBe(404);

      await prisma.user.delete({ where: { id: otherUser.id } });
    } finally {
      await teardownTestApp(ctx);
    }
  });
});
