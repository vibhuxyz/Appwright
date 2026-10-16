import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createSandboxProviderFromEnv,
  LocalSandboxProvider,
  SandboxRuntime,
} from "../src";

describe("createSandboxProviderFromEnv", () => {
  const original = process.env.SANDBOX_PROVIDER;

  afterAll(() => {
    if (original === undefined) delete process.env.SANDBOX_PROVIDER;
    else process.env.SANDBOX_PROVIDER = original;
  });

  it("returns LocalSandboxProvider when SANDBOX_PROVIDER is unset", () => {
    delete process.env.SANDBOX_PROVIDER;
    expect(createSandboxProviderFromEnv()).toBeInstanceOf(LocalSandboxProvider);
  });

  it("returns LocalSandboxProvider when SANDBOX_PROVIDER is local", () => {
    process.env.SANDBOX_PROVIDER = "local";
    expect(createSandboxProviderFromEnv()).toBeInstanceOf(LocalSandboxProvider);
  });
});

describe("packages/sandbox - V3 Slice 1", () => {
  let tempDir: string;
  let provider: LocalSandboxProvider;

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), "aw-sandbox-test-"));
    provider = new LocalSandboxProvider();
  });

  afterAll(async () => {
    await provider.destroyAll();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("boots a local supervisor and passes health check", async () => {
    const sandbox = await provider.create({
      projectId: "test-proj",
      workspaceDir: tempDir,
    });

    const health = await sandbox.checkHealth();
    expect(health.ok).toBe(true);
    expect(typeof health.leaseExpiresAt).toBe("string");
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);

    await provider.destroy(sandbox.id);
  });

  it("writes and reads files within the fenced root", async () => {
    const sandbox = await provider.create({
      projectId: "test-proj",
      workspaceDir: tempDir,
    });

    const writeRes = await sandbox.writeFile("nested/hello.txt", "Hello from Sandbox!");
    expect(writeRes.ok).toBe(true);

    const readRes = await sandbox.readFile("nested/hello.txt");
    expect(readRes.content).toBe("Hello from Sandbox!");
    expect(readRes.truncated).toBe(false);

    await provider.destroy(sandbox.id);
  });

  it("executes commands via argv and captures output", async () => {
    const sandbox = await provider.create({
      projectId: "test-proj",
      workspaceDir: tempDir,
    });

    const res = await sandbox.exec({
      argv: ["echo", "sandbox-wire-check"],
    });

    expect(res.code).toBe(0);
    expect(res.stdout.trim()).toBe("sandbox-wire-check");

    await provider.destroy(sandbox.id);
  });

  it("blocks directory traversal outside the fenced root with 403", async () => {
    const sandbox = await provider.create({
      projectId: "test-proj",
      workspaceDir: tempDir,
    });

    expect(async () => {
      await sandbox.readFile("../../etc/passwd");
    }).toThrow();

    await provider.destroy(sandbox.id);
  });

  it("reserves browser control routes with 501 Not Implemented", async () => {
    const sandbox = await provider.create({
      projectId: "test-proj",
      workspaceDir: tempDir,
    });

    const res = await fetch(`${sandbox.baseUrl}/v1/browser/navigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com" }),
    });

    expect(res.status).toBe(501);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("NOT_IMPLEMENTED");

    await provider.destroy(sandbox.id);
  });

  it("satisfies Runtime interface via SandboxRuntime", async () => {
    const sandbox = await provider.create({
      projectId: "test-proj",
      workspaceDir: tempDir,
    });

    const runtime = new SandboxRuntime(sandbox);
    await runtime.writeFile("sandbox-runtime-test.txt", "bridged-content");
    const content = await runtime.readFile("sandbox-runtime-test.txt");
    expect(content).toBe("bridged-content");

    const execRes = await runtime.exec(["echo", "runtime-ok"], { timeoutMs: 5000 });
    expect(execRes.exitCode).toBe(0);
    expect(execRes.stdout.trim()).toBe("runtime-ok");

    await provider.destroy(sandbox.id);
  });
});
