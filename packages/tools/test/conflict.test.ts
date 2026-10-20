import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { $ } from "bun";
import { detectConflicts, resolveConflicts } from "../src";
import { parseConflictedPaths } from "../src/conflict/parse-conflicts";

const BRANCH = "agent/s1";

async function commitAll(dir: string, message: string): Promise<void> {
  await $`git -C ${dir} add -A`.quiet();
  await $`git -C ${dir} -c user.email=t@t -c user.name=t commit -qm ${message}`.quiet();
}

async function setupConflict(dir: string): Promise<void> {
  await $`git init -q -b main ${dir}`.quiet();
  await writeFile(path.join(dir, "a.txt"), "base\n");
  await writeFile(path.join(dir, "b.txt"), "base\n");
  await commitAll(dir, "init");
  await $`git -C ${dir} checkout -q -b ${BRANCH}`.quiet();
  await writeFile(path.join(dir, "a.txt"), "session\n");
  await writeFile(path.join(dir, "b.txt"), "session\n");
  await commitAll(dir, "session");
  await $`git -C ${dir} checkout -q main`.quiet();
  await writeFile(path.join(dir, "a.txt"), "main\n");
  await writeFile(path.join(dir, "b.txt"), "main\n");
  await commitAll(dir, "main");
}

describe("parseConflictedPaths", () => {
  it("reads paths between the tree id and the first blank entry", () => {
    const out = "abc123\0f 1.txt\0g.txt\0\0messages\0";
    expect(parseConflictedPaths(out)).toEqual(["f 1.txt", "g.txt"]);
  });

  it("returns nothing for a clean tree id", () => {
    expect(parseConflictedPaths("abc123\0")).toEqual([]);
  });
});

describe("conflict detection and resolution", () => {
  let dir = "";

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "conflict-"));
    await setupConflict(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("reports both sides without touching the working tree", async () => {
    const report = await detectConflicts(dir, BRANCH);
    expect(report.hasConflict).toBe(true);
    if (!report.hasConflict) return;
    expect(report.files.map((f) => f.path)).toEqual(["a.txt", "b.txt"]);
    expect(report.files[0]?.main).toBe("main\n");
    expect(report.files[0]?.session).toBe("session\n");
    expect((await $`git -C ${dir} status --porcelain`.text()).trim()).toBe("");
  });

  it("reports no conflict for a clean branch", async () => {
    await $`git -C ${dir} checkout -q -b agent/clean main~1`.quiet();
    await writeFile(path.join(dir, "c.txt"), "c\n");
    await commitAll(dir, "clean");
    await $`git -C ${dir} checkout -q main`.quiet();
    expect(await detectConflicts(dir, "agent/clean")).toEqual({
      hasConflict: false,
    });
  });

  it("applies the chosen side per file and commits the merge", async () => {
    const result = await resolveConflicts(dir, BRANCH, [
      { path: "a.txt", side: "session" },
      { path: "b.txt", side: "main" },
    ]);
    expect(result.ok).toBe(true);
    expect(await readFile(path.join(dir, "a.txt"), "utf8")).toBe("session\n");
    expect(await readFile(path.join(dir, "b.txt"), "utf8")).toBe("main\n");
    expect((await $`git -C ${dir} status --porcelain`.text()).trim()).toBe("");
    const parents = await $`git -C ${dir} rev-list --parents -n 1 HEAD`.text();
    expect(parents.trim().split(" ")).toHaveLength(3);
  });

  it("refuses when a conflicted file has no choice and leaves main untouched", async () => {
    const before = (await $`git -C ${dir} rev-parse HEAD`.text()).trim();
    const result = await resolveConflicts(dir, BRANCH, [
      { path: "a.txt", side: "main" },
    ]);
    expect(result).toMatchObject({
      ok: false,
      reason: "unresolved",
      unresolved: ["b.txt"],
    });
    expect((await $`git -C ${dir} rev-parse HEAD`.text()).trim()).toBe(before);
    expect((await $`git -C ${dir} status --porcelain`.text()).trim()).toBe("");
  });

  it("rejects paths that are not conflicted", async () => {
    const result = await resolveConflicts(dir, BRANCH, [
      { path: "a.txt", side: "main" },
      { path: "b.txt", side: "main" },
      { path: "../outside", side: "session" },
    ]);
    expect(result).toMatchObject({ ok: false, reason: "unknown-path" });
  });

  it("handles a file deleted on one side", async () => {
    await $`git -C ${dir} checkout -q -b agent/del main~1`.quiet();
    await $`git -C ${dir} rm -q a.txt`.quiet();
    await commitAll(dir, "delete a");
    await $`git -C ${dir} checkout -q main`.quiet();
    const result = await resolveConflicts(dir, "agent/del", [
      { path: "a.txt", side: "session" },
    ]);
    expect(result.ok).toBe(true);
    expect(await Bun.file(path.join(dir, "a.txt")).exists()).toBe(false);
  });
});
