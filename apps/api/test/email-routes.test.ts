import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import express from "express";
import type { Server } from "node:http";
import { isDevelopmentSatisfied, prisma } from "@repo/db";
import { emailRouter } from "../src/routes/email-routes";
import { environmentRouter } from "../src/routes/environment";
import { integrationCardRouter } from "../src/routes/integration-card-routes";
import { integrationManagementRouter } from "../src/routes/integrations";

interface TestContext {
  server: Server;
  baseUrl: string;
  user: { id: string; email: string };
  project: { id: string; name: string };
}

let ctx: TestContext;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email: `email-route-user-${Date.now()}@example.com`,
      hashPassword: "password123",
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "Email API Test Project",
      templateId: "nextjs-fullstack",
      workspacePath: "/tmp/email-api-test",
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
  app.use(emailRouter);
  app.use(integrationCardRouter);
  app.use(integrationManagementRouter);

  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");

  ctx = {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    user,
    project,
  };
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    try {
      ctx.server.closeAllConnections?.();
      ctx.server.close(() => resolve());
    } catch {
      resolve();
    }
  });
  await prisma.projectEnvironmentVariable.deleteMany({
    where: { projectId: ctx.project.id },
  });
  await prisma.projectIntegration.deleteMany({
    where: { projectId: ctx.project.id },
  });
  await prisma.secret.deleteMany({ where: { projectId: ctx.project.id } });
  await prisma.project.delete({ where: { id: ctx.project.id } });
  await prisma.user.delete({ where: { id: ctx.user.id } });
});

describe("Email API & Integration Card Routes", () => {
  it("switches email provider and saves credentials securely", async () => {
    const res = await fetch(
      `${ctx.baseUrl}/v1/projects/${ctx.project.id}/environment/email-provider`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment: "development",
          provider: "brevo",
          config: {
            BREVO_API_KEY: "xkeysib-secretkey1234567890",
            EMAIL_FROM: "notifications@app.com",
          },
        }),
      },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; activeProvider: string };
    expect(body.ok).toBe(true);
    expect(body.activeProvider).toBe("brevo");

    const overviewRes = await fetch(
      `${ctx.baseUrl}/v1/projects/${ctx.project.id}/environment`,
    );
    const overview = (await overviewRes.json()) as {
      variables: { key: string; maskedValue: string; isSecret: boolean }[];
    };

    const brevoKey = overview.variables.find((v) => v.key === "BREVO_API_KEY");
    expect(brevoKey).toBeDefined();
    expect(brevoKey?.isSecret).toBe(true);
    expect(brevoKey?.maskedValue).not.toContain("secretkey1234567890");
    expect(brevoKey?.maskedValue).toContain("••••");
  });

  it("handles send-test-email with safe error when credentials cannot connect", async () => {
    const res = await fetch(
      `${ctx.baseUrl}/v1/projects/${ctx.project.id}/environment/send-test-email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment: "development",
          to: "tester@example.com",
          subject: "Test Send",
        }),
      },
    );

    expect(res.status).toBe(422);
    const body = (await res.json()) as { ok: boolean; message: string };
    expect(body.ok).toBe(false);
    expect(body.message).toContain("Email delivery failed");
  });

  it("configures Google OAuth through the shared integration flow", async () => {
    await prisma.projectIntegration.create({
      data: {
        projectId: ctx.project.id,
        provider: "google-oauth",
        required: true,
        status: "missing",
      },
    });
    const res = await fetch(
      `${ctx.baseUrl}/v1/projects/${ctx.project.id}/integrations/configure`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google-oauth",
          credentialMode: "BYOK",
          environment: "development",
          values: {
            GOOGLE_CLIENT_ID: "appwright-test.apps.googleusercontent.com",
            GOOGLE_CLIENT_SECRET: "google-test-secret",
          },
        }),
      },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; message: string };
    expect(body.status).toBe("configured");
    expect(body.message).toContain("Complete Google sign-in");
    const development = await prisma.projectIntegrationEnvironment.findFirstOrThrow({
      where: { environment: "development", integration: { projectId: ctx.project.id, provider: "google-oauth" } },
      select: { status: true },
    });
    expect(isDevelopmentSatisfied("google-oauth", development.status)).toBe(true);
  });

  it("enforces project authorization on email routes", async () => {
    const otherUser = await prisma.user.create({
      data: {
        email: `other-email-user-${Date.now()}@example.com`,
        hashPassword: "password123",
      },
    });
    const otherProject = await prisma.project.create({
      data: {
        name: "Other Project",
        workspacePath: "/tmp/other-email",
        userId: otherUser.id,
      },
    });

    const res = await fetch(
      `${ctx.baseUrl}/v1/projects/${otherProject.id}/environment/email-provider`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment: "development",
          provider: "resend",
        }),
      },
    );

    expect(res.status).toBe(404);

    const integrationResponse = await fetch(
      `${ctx.baseUrl}/v1/projects/${otherProject.id}/integrations/configure`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google-oauth",
          credentialMode: "BYOK",
          environment: "development",
          values: {
            GOOGLE_CLIENT_ID: "other.apps.googleusercontent.com",
            GOOGLE_CLIENT_SECRET: "other-google-secret",
          },
        }),
      },
    );
    expect(integrationResponse.status).toBe(404);

    await prisma.project.delete({ where: { id: otherProject.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});
