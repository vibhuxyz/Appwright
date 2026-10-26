import { describe, expect, test } from "bun:test";
import type { Runtime, Tool } from "@repo/agent-core";
import { ALL_TOOLS, guardTools } from "../src";
import { importedPackages, packageNameOf } from "../src/run-guard/import-specifiers";

const PACKAGE_JSON = JSON.stringify({ dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" } });
const ALLOWED = ["react", "react-dom", "zustand"];

function memoryRuntime(initial: Record<string, string>): Runtime & { files: Map<string, string>; listCalls: () => number } {
  const files = new Map(Object.entries(initial));
  let listCount = 0;
  return {
    files,
    listCalls: () => listCount,
    readFile: async (path) => {
      const content = files.get(path);
      if (content === undefined) throw new Error(`missing ${path}`);
      return content;
    },
    writeFile: async (path, content) => {
      files.set(path, content);
    },
    listDir: async () => {
      listCount += 1;
      return [...files.keys()].sort();
    },
    exec: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
  };
}

function setup(initial: Record<string, string> = { "package.json": PACKAGE_JSON }) {
  const runtime = memoryRuntime(initial);
  const guarded = guardTools(ALL_TOOLS, ALLOWED);
  const byName = new Map(guarded.tools.map((tool) => [tool.name, tool]));
  const call = (name: string, args: Record<string, unknown>) => {
    const tool: Tool | undefined = byName.get(name);
    if (!tool) throw new Error(`no tool ${name}`);
    return tool.execute(args, { runtime });
  };
  return { runtime, call, stats: guarded.stats };
}

describe("read cache", () => {
  test("a repeated read with no change in between returns a reuse note", async () => {
    const { call, stats } = setup({ "package.json": PACKAGE_JSON, "src/App.tsx": "export {}" });
    const first = await call("read_file", { path: "src/App.tsx" });
    const second = await call("read_file", { path: "src/App.tsx" });
    expect(first).toContain("export {}");
    expect(second).toContain("Unchanged since your earlier read_file call");
    expect(stats().cacheHits).toBe(1);
  });

  test("a write between two reads returns fresh content", async () => {
    const { call, stats } = setup({ "package.json": PACKAGE_JSON, "src/App.tsx": "export {}" });
    await call("read_file", { path: "src/App.tsx" });
    await call("write_file", { path: "src/App.tsx", content: "export const changed = 1;" });
    const after = await call("read_file", { path: "src/App.tsx" });
    expect(after).toContain("changed");
    expect(stats().cacheHits).toBe(0);
  });

  test("argument order does not defeat the cache", async () => {
    const { call, stats } = setup({ "package.json": PACKAGE_JSON, "src/a.ts": "a" });
    await call("grep", { pattern: "a", path: "src" });
    await call("grep", { path: "src", pattern: "a" });
    expect(stats().cacheHits).toBe(1);
  });
});

describe("overwrite check", () => {
  test("write_file over an existing unread file is refused", async () => {
    const { call, runtime, stats } = setup({ "package.json": PACKAGE_JSON, "src/App.tsx": "original" });
    await expect(call("write_file", { path: "./src/App.tsx", content: "x" })).rejects.toThrow(/already exists/);
    expect(runtime.files.get("src/App.tsx")).toBe("original");
    expect(stats().overwritesRefused).toBe(1);
  });

  test("write_file after reading the file is allowed", async () => {
    const { call, runtime } = setup({ "package.json": PACKAGE_JSON, "src/App.tsx": "original" });
    await call("read_file", { path: "src/App.tsx" });
    await call("write_file", { path: "src/App.tsx", content: "next" });
    expect(runtime.files.get("src/App.tsx")).toBe("next");
  });

  test("new files and repeated writes of a file created in this run are allowed", async () => {
    const { call, runtime } = setup();
    await call("write_file", { path: "src/New.tsx", content: "one" });
    await call("write_file", { path: "src/New.tsx", content: "two" });
    expect(runtime.files.get("src/New.tsx")).toBe("two");
    expect(runtime.listCalls()).toBe(1);
  });
});

describe("dependency preflight", () => {
  test("a write importing a package missing from package.json is refused before writing", async () => {
    const { call, runtime, stats } = setup();
    const content = `import { create } from "zustand";\nimport NextAuth from "next-auth";\n`;
    const write = call("write_file", { path: "src/store.ts", content });
    await expect(write).rejects.toThrow(/next-auth, zustand, not in package.json/);
    await expect(write).rejects.toThrow(/Add zustand to package.json/);
    await expect(write).rejects.toThrow(/next-auth is not on the allowed package list/);
    expect(runtime.files.has("src/store.ts")).toBe(false);
    expect(stats().missingImportRefusals).toBe(1);
  });

  test("adding the dependency to package.json unblocks the write", async () => {
    const { call, runtime } = setup();
    await call("read_file", { path: "package.json" });
    const withZustand = JSON.stringify({ dependencies: { react: "^19.0.0", zustand: "^5.0.0" } });
    await call("write_file", { path: "package.json", content: withZustand });
    await call("write_file", { path: "src/store.ts", content: `import { create } from "zustand";` });
    expect(runtime.files.has("src/store.ts")).toBe(true);
  });

  test("edit_file checks only the new text", async () => {
    const { call } = setup({ "package.json": PACKAGE_JSON, "src/a.ts": "const a = 1;" });
    const edit = call("edit_file", { path: "src/a.ts", oldString: "const a = 1;", newString: `import x from "lodash";` });
    await expect(edit).rejects.toThrow(/lodash/);
  });

  test("non-code files are never scanned", async () => {
    const { call, runtime } = setup();
    await call("write_file", { path: "README.md", content: `import x from "lodash"` });
    expect(runtime.files.has("README.md")).toBe(true);
  });

  test("a project without package.json skips the check and counts it", async () => {
    const { call, stats } = setup({});
    await call("write_file", { path: "src/a.ts", content: `import x from "lodash";` });
    expect(stats().importChecksSkipped).toBe(1);
  });
});

describe("import specifiers", () => {
  test("normalises subpaths and scoped packages", () => {
    expect(packageNameOf("react-dom/client")).toBe("react-dom");
    expect(packageNameOf("@tanstack/react-query/devtools")).toBe("@tanstack/react-query");
    expect(packageNameOf("next/font/google")).toBe("next");
  });

  test("ignores local, aliased, protocol and built-in imports", () => {
    const source = [
      `import a from "./a";`,
      `import b from "../b";`,
      `import { Button } from "@/components/ui/button";`,
      `import fs from "node:fs";`,
      `import path from "path";`,
      `import test from "bun:test";`,
    ].join("\n");
    expect(importedPackages(source)).toEqual([]);
  });

  test("finds static, side-effect, re-export, type, dynamic and require imports", () => {
    const source = [
      `import type { Session } from "next-auth";`,
      `import "swiper/css";`,
      `export { motion } from "framer-motion";`,
      `import {\n  useQuery,\n} from "@tanstack/react-query";`,
      `const chart = await import("recharts");`,
      `const bcrypt = require("bcryptjs");`,
    ].join("\n");
    expect(importedPackages(source)).toEqual([
      "@tanstack/react-query",
      "bcryptjs",
      "framer-motion",
      "next-auth",
      "recharts",
      "swiper",
    ]);
  });

  test("ignores string values that are not imports", () => {
    expect(importedPackages(`export const label = "lodash";\nconst from = "x";`)).toEqual([]);
  });
});
