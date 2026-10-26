import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import express from "express";
import type { Server } from "node:http";
import { getProjectIntegrationToken, prisma } from "@repo/db";
import { integrationRuntimeRouter } from "../src/routes/integrations/runtime";

interface RuntimeTestContext {
  server: Server;
  baseUrl: string;
  projectId: string;
  userId: string;
  developmentToken: string;
  previewToken: string;
}

let context: RuntimeTestContext;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email: `integration-runtime-${crypto.randomUUID()}@example.com`,
      hashPassword: "test-password",
    },
  });
  const project = await prisma.project.create({
    data: {
      name: "Integration Runtime Test",
      workspacePath: `/tmp/integration-runtime-${crypto.randomUUID()}`,
      userId: user.id,
    },
  });
  await prisma.projectIntegration.create({
    data: {
      projectId: project.id,
      provider: "email",
      status: "connected",
      environments: {
        create: { environment: "development", credentialMode: "BYOK", status: "connected" },
      },
    },
  });
  const [developmentToken, previewToken] = await Promise.all([
    getProjectIntegrationToken(project.id, "development"),
    getProjectIntegrationToken(project.id, "preview"),
  ]);
  const app = express();
  app.use(express.json());
  app.use(integrationRuntimeRouter);
  app.get("/health", (_request, response) => response.sendStatus(204));
  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  context = {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    projectId: project.id,
    userId: user.id,
    developmentToken,
    previewToken,
  };
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    context.server.closeAllConnections?.();
    context.server.close(() => resolve());
  });
  await prisma.project.delete({ where: { id: context.projectId } });
  await prisma.user.delete({ where: { id: context.userId } });
});

describe("Integration runtime gateway", () => {
  it("requires a project integration token and blocks browser calls", async () => {
    const request = await fetch(`${context.baseUrl}/v1/integrations/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${context.developmentToken}`,
        Origin: "https://customer.example",
      },
      body: JSON.stringify({ to: "user@example.com", subject: "Receipt", text: "Thanks" }),
    });
    expect(request.status).toBe(403);

    const missingToken = await fetch(`${context.baseUrl}/v1/integrations/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "user@example.com", subject: "Receipt", text: "Thanks" }),
    });
    expect(missingToken.status).toBe(401);

    const unrelatedRequest = await fetch(`${context.baseUrl}/health`, {
      headers: { Origin: "https://customer.example" },
    });
    expect(unrelatedRequest.status).toBe(204);
  });

  it("isolates connected integration configuration by environment token", async () => {
    const response = await fetch(`${context.baseUrl}/v1/integrations/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${context.previewToken}`,
        "Idempotency-Key": "preview-email-request-1",
      },
      body: JSON.stringify({ to: "user@example.com", subject: "Receipt", text: "Thanks" }),
    });
    const body = await response.json() as { error: { code: string } };
    expect(response.status).toBe(422);
    expect(body.error.code).toBe("INTEGRATION_NOT_CONFIGURED");
  });
});
