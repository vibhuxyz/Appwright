import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import express from "express";
import type { Server } from "node:http";
import { prisma } from "@repo/db";
import { attachmentRouter } from "../src/routes/attachment-routes";

interface TestContext {
  server: Server;
  baseUrl: string;
  user: { id: string; email: string };
  otherUser: { id: string; email: string };
  project: { id: string; name: string };
}

let ctx: TestContext;

const PNG_HEADER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0xf3, 0xff,
  0x61, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
  0x44, 0xae, 0x42, 0x60, 0x82,
]);

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email: `attachment-user-${Date.now()}@example.com`,
      hashPassword: "password123",
    },
  });

  const otherUser = await prisma.user.create({
    data: {
      email: `attachment-other-${Date.now()}@example.com`,
      hashPassword: "password123",
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "Attachment API Test Project",
      templateId: "nextjs-fullstack",
      workspacePath: "/tmp/attachment-api-test",
      userId: user.id,
    },
  });

  const app = express();
  app.use((req, _res, next) => {
    const override = req.headers["x-test-user-id"];
    req.userId = typeof override === "string" ? override : user.id;
    next();
  });
  app.use(attachmentRouter);

  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");

  ctx = {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    user,
    otherUser,
    project,
  };
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    ctx.server.close(() => resolve());
  });
  await prisma.projectAttachment.deleteMany({
    where: { projectId: ctx.project.id },
  }).catch(() => null);
  await prisma.project.delete({ where: { id: ctx.project.id } }).catch(() => null);
  await prisma.user.delete({ where: { id: ctx.user.id } }).catch(() => null);
  await prisma.user.delete({ where: { id: ctx.otherUser.id } }).catch(() => null);
});

describe("Attachment API Routes", () => {
  let createdAttachmentId = "";

  it("uploads an image attachment successfully", async () => {
    const form = new FormData();
    form.append("file", new Blob([PNG_HEADER], { type: "image/png" }), "wireframe.png");

    const res = await fetch(
      `${ctx.baseUrl}/v1/projects/${ctx.project.id}/attachments/upload?sessionId=test-session`,
      { method: "POST", body: form },
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      id: string;
      name: string;
      mimeType: string;
      type: string;
      dataUrl?: string;
    };
    expect(body.name).toBe("wireframe.png");
    expect(body.mimeType).toBe("image/png");
    expect(body.type).toBe("image");
    expect(body.dataUrl).toContain("data:image/png;base64");
    createdAttachmentId = body.id;
  });

  it("lists project attachments", async () => {
    const res = await fetch(`${ctx.baseUrl}/v1/projects/${ctx.project.id}/attachments`);
    expect(res.status).toBe(200);
    const list = (await res.json()) as Array<{ id: string; name: string }>;
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((a) => a.id === createdAttachmentId)).toBe(true);
  });

  it("downloads the uploaded attachment", async () => {
    const res = await fetch(
      `${ctx.baseUrl}/v1/projects/${ctx.project.id}/attachments/${createdAttachmentId}/download`,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.length).toBe(PNG_HEADER.length);
  });

  it("rejects unauthorized access from non-owner", async () => {
    const res = await fetch(`${ctx.baseUrl}/v1/projects/${ctx.project.id}/attachments`, {
      headers: { "x-test-user-id": ctx.otherUser.id },
    });
    expect(res.status).toBe(404);
  });

  it("rejects file with mismatched extension and magic bytes", async () => {
    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: "image/png" }),
      "fake.png",
    );

    const res = await fetch(
      `${ctx.baseUrl}/v1/projects/${ctx.project.id}/attachments/upload`,
      { method: "POST", body: form },
    );

    expect(res.status).toBe(400);
  });
});
