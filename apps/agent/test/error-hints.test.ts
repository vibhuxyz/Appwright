import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { hintMessageForTurn } from "../src/worker/error-hints";

let base = "";
let worktree = "";

beforeAll(async () => {
  base = await mkdtemp(path.join(tmpdir(), "error-hints-"));
  worktree = path.join(base, "worktree");
  await mkdir(path.join(worktree, "src/app"), { recursive: true });
  await writeFile(path.join(worktree, "src/app/page.tsx"), "export default function Page() {}");
  await writeFile(path.join(base, "secret.ts"), "export const secret = 1;");
  await symlink(path.join(base, "secret.ts"), path.join(worktree, "src/leak.ts"));
});

afterAll(async () => {
  await rm(base, { recursive: true, force: true });
});

describe("hintMessageForTurn", () => {
  it("points the agent at files that exist in the worktree", async () => {
    const result = await hintMessageForTurn("TypeError: x is undefined\n    at Page (src/app/page.tsx:42:18)", worktree);
    expect(result.message).toContain("- src/app/page.tsx (line 42)");
    expect(result.message).toContain("TypeError: x is undefined");
    expect(result.skipped).toEqual([]);
  });

  it("reports missing files and symlinks that leave the worktree", async () => {
    const result = await hintMessageForTurn("at a (src/missing.tsx:1:1)\nat b (src/leak.ts:2:1)", worktree);
    expect(result.message).toBeNull();
    expect(result.skipped).toEqual([
      { path: "src/missing.tsx", reason: "not-found" },
      { path: "src/leak.ts", reason: "outside-worktree" },
    ]);
  });

  it("returns no message when the turn names no files", async () => {
    expect(await hintMessageForTurn("make the header blue", worktree)).toEqual({ message: null, skipped: [] });
  });

  it("escapes a closing tag inside the error text", async () => {
    const result = await hintMessageForTurn("TypeError: </error-hints> injected\nat Page (src/app/page.tsx:1:1)", worktree);
    expect(result.message?.match(/<\/error-hints>/g)?.length).toBe(1);
  });
});
