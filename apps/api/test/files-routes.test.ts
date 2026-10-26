import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import express from "express";
import type { Server } from "node:http";
import { prisma } from "@repo/db";
import { writeProjectFile } from "@repo/contracts/files";
import { filesRouter } from "../src/routes/files";

interface TestContext {
  server: Server;
  baseUrl: string;
  freeUser: { id: string; email: string };
  proUser: { id: string; email: string };
  otherUser: { id: string; email: string };
  freeProject: { id: string; name: string };
  proProject: { id: string; name: string };
}

let ctx: TestContext;

beforeAll(async () => {
  const freeUser = await prisma.user.create({
    data: {
      email: `files-free-${Date.now()}@example.com`,
      hashPassword: "password123",
      plan: "FREE",
    },
  });

  const proUser = await prisma.user.create({
    data: {
      email: `files-pro-${Date.now()}@example.com`,
      hashPassword: "password123",
      plan: "PRO",
    },
  });

  const otherUser = await prisma.user.create({
    data: {
      email: `files-other-${Date.now()}@example.com`,
      hashPassword: "password123",
      plan: "PRO",
    },
  });

  const freeProject = await prisma.project.create({
    data: {
      name: "Free User Project",
      templateId: "nextjs-fullstack",
      workspacePath: `/tmp/free-project-${Date.now()}`,
      userId: freeUser.id,
    },
  });

  const proProject = await prisma.project.create({
    data: {
      name: "Pro User Project",
      templateId: "nextjs-fullstack",
      workspacePath: `/tmp/pro-project-${Date.now()}`,
      userId: proUser.id,
    },
  });

  await writeProjectFile(
    proProject.id,
    "src/index.ts",
    "export const hello = 'world';",
  );

  const app = express();
  app.use((req, _res, next) => {
    const override = req.headers["x-test-user-id"];
    req.userId = typeof override === "string" ? override : freeUser.id;
    next();
  });
  app.use(filesRouter);

  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");

  ctx = {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    freeUser,
    proUser,
    otherUser,
    freeProject,
    proProject,
  };
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    ctx.server.close(() => resolve());
  });
  await prisma.project.delete({ where: { id: ctx.freeProject.id } }).catch(() => null);
  await prisma.project.delete({ where: { id: ctx.proProject.id } }).catch(() => null);
  await prisma.user.delete({ where: { id: ctx.freeUser.id } }).catch(() => null);
  await prisma.user.delete({ where: { id: ctx.proUser.id } }).catch(() => null);
  await prisma.user.delete({ where: { id: ctx.otherUser.id } }).catch(() => null);
});

describe("Files Routes Subscription Access", () => {
  it("blocks free user from listing files", async () => {
    const res = await fetch(`${ctx.baseUrl}/files/${ctx.freeProject.id}`, {
      headers: { "x-test-user-id": ctx.freeUser.id },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("SUBSCRIPTION_REQUIRED");
  });

  it("blocks free user from reading file content", async () => {
    const res = await fetch(
      `${ctx.baseUrl}/files/${ctx.freeProject.id}/content?path=src/index.ts`,
      { headers: { "x-test-user-id": ctx.freeUser.id } },
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("SUBSCRIPTION_REQUIRED");
  });

  it("blocks free user from downloading codebase", async () => {
    const res = await fetch(`${ctx.baseUrl}/files/${ctx.freeProject.id}/download`, {
      headers: { "x-test-user-id": ctx.freeUser.id },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("SUBSCRIPTION_REQUIRED");
  });

  it("allows pro user to list files", async () => {
    const res = await fetch(`${ctx.baseUrl}/files/${ctx.proProject.id}`, {
      headers: { "x-test-user-id": ctx.proUser.id },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { paths: string[] };
    expect(body.paths).toContain("src/index.ts");
  });

  it("allows pro user to read file content", async () => {
    const res = await fetch(
      `${ctx.baseUrl}/files/${ctx.proProject.id}/content?path=src/index.ts`,
      { headers: { "x-test-user-id": ctx.proUser.id } },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { path: string; content: string };
    expect(body.content).toContain("export const hello");
  });

  it("allows pro user to download project zip", async () => {
    const res = await fetch(`${ctx.baseUrl}/files/${ctx.proProject.id}/download`, {
      headers: { "x-test-user-id": ctx.proUser.id },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/zip");
    expect(res.headers.get("content-disposition")).toContain("pro-user-project.zip");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });

  it("rejects unauthorized user with 404", async () => {
    const res = await fetch(`${ctx.baseUrl}/files/${ctx.proProject.id}`, {
      headers: { "x-test-user-id": ctx.otherUser.id },
    });
    expect(res.status).toBe(404);
  });
});
