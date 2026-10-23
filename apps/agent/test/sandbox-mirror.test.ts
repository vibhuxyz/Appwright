import { describe, expect, it } from "bun:test";
import {
  MAX_PATHS_PER_SYNC,
  SandboxMirror,
  mightChangeFiles,
  parsePorcelainZ,
  type SandboxMirrorPorts,
} from "../src/mirror";

function porcelain(...entries: string[]): string {
  return entries.map((entry) => `${entry}\0`).join("");
}

function fakePorts(status: string, files: Record<string, string>) {
  const hostFiles = new Map<string, string>();
  const removed: string[] = [];
  const ports: SandboxMirrorPorts = {
    listChanges: async () => status,
    readSandboxFile: async (path) => {
      const content = files[path];
      if (content === undefined) throw new Error(`missing ${path}`);
      return content;
    },
    writeHostFile: async (path, content) => {
      hostFiles.set(path, content);
    },
    removeHostFile: async (path) => {
      removed.push(path);
    },
  };
  return { ports, hostFiles, removed };
}

describe("parsePorcelainZ", () => {
  it("separates modified, untracked and deleted paths", () => {
    expect(parsePorcelainZ(porcelain(" M src/a.ts", "?? src/b.ts", " D src/c.ts", "D  src/d.ts"))).toEqual([
      { path: "src/a.ts", kind: "upsert" },
      { path: "src/b.ts", kind: "upsert" },
      { path: "src/c.ts", kind: "delete" },
      { path: "src/d.ts", kind: "delete" },
    ]);
  });

  it("treats a rename as an upsert of the new path and a delete of the old one", () => {
    expect(parsePorcelainZ(`R  src/new.ts\0src/old.ts\0`)).toEqual([
      { path: "src/new.ts", kind: "upsert" },
      { path: "src/old.ts", kind: "delete" },
    ]);
  });

  it("returns nothing for a clean tree", () => {
    expect(parsePorcelainZ("")).toEqual([]);
  });
});

describe("mightChangeFiles", () => {
  it("skips read-only commands and read-only git subcommands", () => {
    expect(mightChangeFiles(["ls", "-la"])).toBe(false);
    expect(mightChangeFiles(["git", "status"])).toBe(false);
  });

  it("syncs after anything that can write", () => {
    expect(mightChangeFiles(["sed", "-i", "s/a/b/", "x.ts"])).toBe(true);
    expect(mightChangeFiles(["bun", "add", "zod"])).toBe(true);
    expect(mightChangeFiles(["git", "checkout", "."])).toBe(true);
  });
});

describe("SandboxMirror", () => {
  it("copies files changed by bash to the host, which writeFile mirroring would have missed", async () => {
    const { ports, hostFiles } = fakePorts(porcelain(" M src/lib/slots.ts"), { "src/lib/slots.ts": "fixed" });
    const report = await new SandboxMirror(ports).syncChanges();
    expect(report.written).toEqual(["src/lib/slots.ts"]);
    expect(hostFiles.get("src/lib/slots.ts")).toBe("fixed");
  });

  it("removes files the sandbox deleted", async () => {
    const { ports, removed } = fakePorts(porcelain(" D src/old.ts"), {});
    const report = await new SandboxMirror(ports).syncChanges();
    expect(report.removed).toEqual(["src/old.ts"]);
    expect(removed).toEqual(["src/old.ts"]);
  });

  it("does not rewrite a file whose content the host already has", async () => {
    const { ports, hostFiles } = fakePorts(porcelain(" M a.ts"), { "a.ts": "same" });
    const mirror = new SandboxMirror(ports);
    mirror.remember("a.ts", "same");
    const report = await mirror.syncChanges();
    expect(report.written).toEqual([]);
    expect(hostFiles.size).toBe(0);
  });

  it("reports binary files instead of corrupting them", async () => {
    const { ports } = fakePorts(porcelain("?? public/logo.png"), { "public/logo.png": "PNG\u0000data" });
    const report = await new SandboxMirror(ports).syncChanges();
    expect(report.skipped).toEqual([{ path: "public/logo.png", reason: "binary content" }]);
  });

  it("ignores dependency and build folders", async () => {
    const { ports } = fakePorts(porcelain("?? node_modules/x/index.js", "?? .next/cache/a"), {});
    const report = await new SandboxMirror(ports).syncChanges();
    expect(report).toEqual({ written: [], removed: [], skipped: [] });
  });

  it("reports the paths it did not copy once the per-sync cap is reached", async () => {
    const names = Array.from({ length: MAX_PATHS_PER_SYNC + 2 }, (_, index) => `f${index}.ts`);
    const { ports } = fakePorts(
      porcelain(...names.map((name) => `?? ${name}`)),
      Object.fromEntries(names.map((name) => [name, "x"])),
    );
    const report = await new SandboxMirror(ports).syncChanges();
    expect(report.written).toHaveLength(MAX_PATHS_PER_SYNC);
    expect(report.skipped).toHaveLength(2);
  });
});
