import { afterAll, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import type { Runtime } from "@repo/agent-core";
import { readProjectFile } from "@repo/contracts/files";
import { sessionWorktreePath, WORKSPACES_DIR } from "@repo/workspace";
import { HostMirrorRuntime } from "../src/worker/host-mirror-runtime";

class FakeRuntime implements Runtime {
  public readonly writes: Array<{ path: string; content: string }> = [];

  async readFile(): Promise<string> {
    return "";
  }

  async writeFile(workspacePath: string, content: string): Promise<void> {
    this.writes.push({ path: workspacePath, content });
  }

  async listDir(): Promise<string[]> {
    return [];
  }

  async exec(): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return { stdout: "", stderr: "", exitCode: 0 };
  }
}

describe("HostMirrorRuntime", () => {
  const projectId = `mirror-${Date.now()}`;
  const sessionId = `sess-${Date.now()}`;
  const worktreeDir = sessionWorktreePath(projectId, sessionId);

  afterAll(() => {
    rmSync(`${WORKSPACES_DIR}/${projectId}`, { recursive: true, force: true });
  });

  it("writes through to the sandbox and mirrors onto the host worktree", async () => {
    mkdirSync(worktreeDir, { recursive: true });

    const inner = new FakeRuntime();
    const runtime = new HostMirrorRuntime(inner, projectId, sessionId);
    await runtime.writeFile(
      "src/components/BakeryHero.tsx",
      "export function BakeryHero() { return null; }\n",
    );

    expect(inner.writes).toEqual([
      {
        path: "src/components/BakeryHero.tsx",
        content: "export function BakeryHero() { return null; }\n",
      },
    ]);

    const hosted = await readProjectFile(
      projectId,
      "src/components/BakeryHero.tsx",
      sessionId,
    );
    expect(hosted).toContain("BakeryHero");
  });

  it("does not fail the tool when the host mirror cannot write", async () => {
    const inner = new FakeRuntime();
    const runtime = new HostMirrorRuntime(inner, "not a valid id", sessionId);
    await runtime.writeFile("src/page.tsx", "ok");
    expect(inner.writes).toHaveLength(1);
  });
});
