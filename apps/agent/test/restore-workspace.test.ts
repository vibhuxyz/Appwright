import { afterAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalSandboxProvider } from "@repo/sandbox";
import { $ } from "bun";
import { restoreWorkspace } from "../src/recovery";

describe("restoreWorkspace", () => {
  const root = mkdtempSync(join(tmpdir(), "restore-workspace-"));
  const provider = new LocalSandboxProvider();

  afterAll(async () => {
    await provider.destroyAll();
    rmSync(root, { recursive: true, force: true });
  });

  async function initRepo(dir: string): Promise<void> {
    mkdirSync(dir, { recursive: true });
    await $`git -C ${dir} init -q`;
    await $`git -C ${dir} config user.email test@example.com`;
    await $`git -C ${dir} config user.name test`;
  }

  it("reports an intact workspace when files are tracked", async () => {
    const dir = join(root, "intact");
    await initRepo(dir);
    await Bun.write(join(dir, "a.txt"), "a");
    await $`git -C ${dir} add .`.quiet();
    await $`git -C ${dir} commit -q -m one`;
    const sandbox = await provider.create({ projectId: "intact", workspaceDir: dir });
    const outcome = await restoreWorkspace(sandbox, { remoteUrl: undefined });
    expect(outcome.kind).toBe("intact");
  });

  it("restores a fresh sandbox from the last pushed commit after the old one died", async () => {
    const remote = join(root, "remote.git");
    const origin = join(root, "origin");
    await $`git init -q --bare ${remote}`;
    await initRepo(origin);
    await Bun.write(join(origin, "app.txt"), "checkpointed");
    await $`git -C ${origin} add .`.quiet();
    await $`git -C ${origin} commit -q -m checkpoint`;
    await $`git -C ${origin} push -q ${remote} HEAD`;

    const fresh = join(root, "fresh");
    await initRepo(fresh);
    await $`git -C ${fresh} commit -q --allow-empty -m snapshot`;

    const dead = await provider.create({ projectId: "dead", workspaceDir: fresh });
    await provider.destroy(dead.id);
    const replacement = await provider.create({ projectId: "alive", workspaceDir: fresh });

    const outcome = await restoreWorkspace(replacement, { remoteUrl: remote });
    expect(outcome.kind).toBe("restored");
    const file = await replacement.readFile("app.txt");
    expect(file.content).toBe("checkpointed");
  });

  it("reports nothing to restore for an empty workspace without a remote", async () => {
    const dir = join(root, "empty");
    await initRepo(dir);
    await $`git -C ${dir} commit -q --allow-empty -m snapshot`;
    const sandbox = await provider.create({ projectId: "empty", workspaceDir: dir });
    expect(await restoreWorkspace(sandbox, { remoteUrl: undefined })).toEqual({
      kind: "nothing-to-restore",
    });
  });

  it("reports a failure naming the step when the remote is unreachable", async () => {
    const dir = join(root, "bad-remote");
    await initRepo(dir);
    await $`git -C ${dir} commit -q --allow-empty -m snapshot`;
    const sandbox = await provider.create({ projectId: "bad", workspaceDir: dir });
    const outcome = await restoreWorkspace(sandbox, { remoteUrl: join(root, "missing.git") });
    expect(outcome.kind).toBe("failed");
  });
});
