import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
  dismissIntegrationRequest,
  listPendingIntegrationRequests,
  openIntegrationRequest,
  openRequiredIntegrationRequests,
  settleIntegrationRequests,
} from "../src/integration-request";
import { prisma } from "../src/lib/prisma";

const HOUR_MS = 3_600_000;

describe("integration request repository", () => {
  let userId = "";
  let projectId = "";
  let sessionId = "";

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: `int-req-${Date.now()}@example.com`, hashPassword: "x" } });
    const project = await prisma.project.create({ data: { name: "Requests", workspacePath: "/tmp/r", userId: user.id } });
    const session = await prisma.session.create({ data: { projectId: project.id } });
    userId = user.id;
    projectId = project.id;
    sessionId = session.id;
    await prisma.projectIntegration.create({ data: { projectId, provider: "email", required: true, status: "missing" } });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
  });

  it("opens requests for required integrations that are not connected in development", async () => {
    const expiresAt = new Date(Date.now() + HOUR_MS);
    const opened = await openRequiredIntegrationRequests({ projectId, sessionId, expiresAt });
    expect(opened.map((item) => item.provider)).toEqual(["email"]);
    const pending = await listPendingIntegrationRequests(sessionId, new Date());
    expect(pending.map((item) => item.provider)).toEqual(["email"]);
  });

  it("settles a request once development is connected and marks the integration required", async () => {
    const expiresAt = new Date(Date.now() + HOUR_MS);
    const request = await openIntegrationRequest({ sessionId, projectId, provider: "razorpay", reason: "Take payments", expiresAt });
    const integration = await prisma.projectIntegration.findUniqueOrThrow({
      where: { projectId_provider: { projectId, provider: "razorpay" } },
    });
    expect(integration.required).toBe(true);

    await prisma.projectIntegrationEnvironment.create({
      data: { integrationId: integration.id, environment: "development", credentialMode: "APPWRITE_MANAGED", status: "connected" },
    });
    const settled = await settleIntegrationRequests({ ids: [request.id], now: new Date() });
    expect(settled.pendingCount).toBe(0);
    expect(settled.outcomes[0]).toMatchObject({ provider: "razorpay", status: "CONNECTED", credentialMode: "APPWRITE_MANAGED" });
  });

  it("re-opens a dismissed request for the same session", async () => {
    const expiresAt = new Date(Date.now() + HOUR_MS);
    const first = await openIntegrationRequest({ sessionId, projectId, provider: "cloudinary", reason: "Upload photos", expiresAt });
    expect(await dismissIntegrationRequest({ id: first.id, now: new Date() })).toBe(true);
    const reopened = await openIntegrationRequest({ sessionId, projectId, provider: "cloudinary", reason: "Upload photos", expiresAt });
    expect(reopened.id).toBe(first.id);
    const pending = await listPendingIntegrationRequests(sessionId, new Date());
    expect(pending.some((item) => item.provider === "cloudinary")).toBe(true);
  });
});
