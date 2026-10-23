import { afterEach, describe, expect, it } from "bun:test";
import { lstatSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInstall } from "../src/install";

const workDirs: string[] = [];

function makeWorkDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "verify-install-"));
  workDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of workDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("runInstall", () => {
  it("passes without running anything when there is no package.json", async () => {
    const result = await runInstall(makeWorkDir());
    expect(result).toEqual({ ok: true, check: "install", errors: [] });
  });

  it("installs a manifest with no dependencies", async () => {
    const dir = makeWorkDir();
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "fixture", version: "1.0.0" }));
    const result = await runInstall(dir);
    expect(result.ok).toBe(true);
  });

  it("replaces a node_modules symlink with a real directory", async () => {
    const dir = makeWorkDir();
    const elsewhere = makeWorkDir();
    mkdirSync(join(elsewhere, "shared"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "fixture", version: "1.0.0" }));
    symlinkSync(join(elsewhere, "shared"), join(dir, "node_modules"));
    const result = await runInstall(dir);
    expect(result.ok).toBe(true);
    const modules = lstatSync(join(dir, "node_modules"), { throwIfNoEntry: false });
    expect(modules?.isSymbolicLink() ?? false).toBe(false);
  });

  it("reports a failed install with the directory it ran in", async () => {
    const dir = makeWorkDir();
    writeFileSync(join(dir, "package.json"), "{ not json");
    const result = await runInstall(dir);
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.message).toContain(dir);
  });
});
