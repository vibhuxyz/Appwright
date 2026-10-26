import { afterAll, describe, expect, it } from "bun:test";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createSandboxProviderFromEnv } from "../src";

const AGENT_CORE_SRC = resolve(import.meta.dir, "../../agent-core/src");
const FORBIDDEN_IMPORT = /^\s*(?:import|export)\b.*from\s+["'](?:node:)?fs(?:\/promises)?["']/m;

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const fullPath = join(dir, name);
      if (statSync(fullPath).isDirectory()) return listSourceFiles(fullPath);
      return fullPath.endsWith(".ts") ? [fullPath] : [];
    });
}

const providerKinds = process.env.E2B_API_KEY ? ["local", "e2b"] : ["local"];
const LOCAL_TEST_TIMEOUT_MS = 5_000;
const REMOTE_SANDBOX_TEST_TIMEOUT_MS = 60_000;

describe.each(providerKinds)("sandbox provider contract (SANDBOX_PROVIDER=%s)", (kind) => {
  const timeoutMs = kind === "e2b" ? REMOTE_SANDBOX_TEST_TIMEOUT_MS : LOCAL_TEST_TIMEOUT_MS;
  const original = process.env.SANDBOX_PROVIDER;
  process.env.SANDBOX_PROVIDER = kind;
  const provider = createSandboxProviderFromEnv();
  const workspaceDir = mkdtempSync(join(tmpdir(), `provider-contract-${kind}-`));
  process.env.SANDBOX_PROVIDER = original;

  afterAll(async () => {
    await provider.destroyAll();
    rmSync(workspaceDir, { recursive: true, force: true });
  });

  it("serves exec, file write and file read through the same client", async () => {
    const sandbox = await provider.create({ projectId: `contract-${kind}`, workspaceDir });
    const health = await sandbox.checkHealth();
    expect(health.ok).toBe(true);

    await sandbox.writeFile("hello.txt", "hi");
    const read = await sandbox.readFile("hello.txt");
    expect(read.content).toBe("hi");

    const exec = await sandbox.exec({ argv: ["echo", "boundary"] });
    expect(exec.code).toBe(0);
    expect(exec.stdout.trim()).toBe("boundary");
  }, timeoutMs);

  it("answers reserved browser routes with 501", async () => {
    const sandbox = await provider.create({ projectId: `contract-${kind}`, workspaceDir });
    const response = await fetch(`${sandbox.baseUrl}/v1/browser/navigate`, { method: "POST" });
    expect(response.status).toBe(501);
  }, timeoutMs);
});

describe("sandbox boundary", () => {
  it("keeps node:fs out of packages/agent-core", () => {
    const offenders = listSourceFiles(AGENT_CORE_SRC).filter((file) =>
      FORBIDDEN_IMPORT.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
