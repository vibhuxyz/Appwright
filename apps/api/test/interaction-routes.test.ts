import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import express from "express";
import type { Server } from "node:http";
import { createAgentQuestion, openIntegrationRequest, prisma } from "@repo/db";
import { interactionsRouter } from "../src/routes/interactions";

const HOUR_MS = 3_600_000;
const questions = [
  { label: "Payment Purpose", text: "What should customers pay for?", options: ["Booking fee", "Advance"], defaultOptionIndex: 0, inputType: "single" as const },
];

let server: Server;
let baseUrl = "";
let ownerId = "";
let strangerId = "";
let sessionId = "";
let projectId = "";
let actingUserId = "";

function post(path: string, body?: unknown): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeAll(async () => {
  const owner = await prisma.user.create({ data: { email: `interactions-owner-${Date.now()}@example.com`, hashPassword: "x" } });
  const stranger = await prisma.user.create({ data: { email: `interactions-stranger-${Date.now()}@example.com`, hashPassword: "x" } });
  const project = await prisma.project.create({ data: { name: "Interactions", workspacePath: "/tmp/i", userId: owner.id } });
  const session = await prisma.session.create({ data: { projectId: project.id } });
  ownerId = owner.id;
  strangerId = stranger.id;
  projectId = project.id;
  sessionId = session.id;
  actingUserId = ownerId;

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.userId = actingUserId;
    next();
  });
  app.use(interactionsRouter);
  server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  server.closeAllConnections?.();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.user.deleteMany({ where: { id: { in: [ownerId, strangerId] } } });
});

describe("agent question routes", () => {
  it("lists, validates, answers once, and rejects strangers", async () => {
    const { id } = await createAgentQuestion({ sessionId, toolCallId: null, questions, expiresAt: new Date(Date.now() + HOUR_MS) });

    const list = (await (await fetch(`${baseUrl}/v1/sessions/${sessionId}/agent-questions`)).json()) as { items: { id: string }[] };
    expect(list.items.map((item) => item.id)).toContain(id);

    expect((await post(`/v1/agent-questions/${id}/answers`, { answers: [{ selectedOptionIndexes: [0, 1] }] })).status).toBe(400);

    actingUserId = strangerId;
    expect((await post(`/v1/agent-questions/${id}/answers`, { answers: [{ selectedOptionIndexes: [0] }] })).status).toBe(404);
    actingUserId = ownerId;

    expect((await post(`/v1/agent-questions/${id}/answers`, { answers: [{ selectedOptionIndexes: [1] }] })).status).toBe(200);
    expect((await post(`/v1/agent-questions/${id}/answers`, { answers: [{ selectedOptionIndexes: [1] }] })).status).toBe(409);
  });

  it("dismisses a pending question and 404s malformed ids", async () => {
    const { id } = await createAgentQuestion({ sessionId, toolCallId: null, questions, expiresAt: new Date(Date.now() + HOUR_MS) });
    expect((await post(`/v1/agent-questions/${id}/dismiss`)).status).toBe(204);
    expect((await post("/v1/agent-questions/not-a-uuid/dismiss")).status).toBe(404);
  });
});

describe("integration request routes", () => {
  it("lists pending requests for the session and dismisses them", async () => {
    const request = await openIntegrationRequest({
      sessionId,
      projectId,
      provider: "email",
      reason: "Send booking confirmations",
      expiresAt: new Date(Date.now() + HOUR_MS),
    });
    const list = (await (await fetch(`${baseUrl}/v1/sessions/${sessionId}/integration-requests`)).json()) as {
      items: { id: string; reason: string }[];
    };
    expect(list.items).toEqual([expect.objectContaining({ id: request.id, reason: "Send booking confirmations" })]);
    expect((await post(`/v1/integration-requests/${request.id}/dismiss`)).status).toBe(204);
    expect((await post(`/v1/integration-requests/${request.id}/dismiss`)).status).toBe(409);
  });
});
