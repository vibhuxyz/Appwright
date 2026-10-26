import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { openIntegrationRequest, prisma } from "@repo/db";
import { awaitIntegrationRequests } from "../src/worker/integrations";

const HOUR_MS = 3_600_000;

describe("awaitIntegrationRequests", () => {
  let userId = "";
  let projectId = "";
  let sessionId = "";

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: `await-int-${Date.now()}@example.com`, hashPassword: "x" } });
    const project = await prisma.project.create({ data: { name: "Await", workspacePath: "/tmp/await", userId: user.id } });
    const session = await prisma.session.create({ data: { projectId: project.id } });
    userId = user.id;
    projectId = project.id;
    sessionId = session.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
  });

  it("resolves once the development environment is connected", async () => {
    const request = await openIntegrationRequest({
      sessionId, projectId, provider: "email", reason: "Send receipts", expiresAt: new Date(Date.now() + HOUR_MS),
    });
    const waiting = awaitIntegrationRequests({ ids: [request.id], signal: new AbortController().signal, timeoutMs: 10_000 });
    const integration = await prisma.projectIntegration.findUniqueOrThrow({
      where: { projectId_provider: { projectId, provider: "email" } },
    });
    await prisma.projectIntegrationEnvironment.create({
      data: { integrationId: integration.id, environment: "development", credentialMode: "APPWRITE_MANAGED", status: "connected" },
    });
    const outcome = await waiting;
    expect(outcome.status).toBe("resolved");
    if (outcome.status === "resolved") expect(outcome.value[0]?.status).toBe("CONNECTED");
  });

  it("times out when nothing is connected", async () => {
    const request = await openIntegrationRequest({
      sessionId, projectId, provider: "cloudinary", reason: "Upload photos", expiresAt: new Date(Date.now() + HOUR_MS),
    });
    const outcome = await awaitIntegrationRequests({ ids: [request.id], signal: new AbortController().signal, timeoutMs: 50 });
    expect(outcome.status).toBe("timeout");
  });
});
