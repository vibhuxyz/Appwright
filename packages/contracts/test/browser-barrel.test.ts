import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import * as contracts from "../src/index.ts";
import * as files from "../src/utils/projectFiles.ts";

const NODE_ONLY_EXPORTS = [
  "workspaceRoot",
  "safeResolve",
  "listProjectFiles",
  "listProjectPaths",
  "readProjectFile",
  "writeProjectFile",
  "applyFileToolOps",
] as const;

const barrelSource = readFileSync(
  path.join(import.meta.dir, "../src/index.ts"),
  "utf8",
);

describe("contracts browser barrel", () => {
  test("source does not import Node filesystem helpers", () => {
    expect(barrelSource).not.toContain("projectFiles");
    expect(barrelSource).not.toContain("node:fs");
  });

  test("runtime export surface omits Node filesystem helpers", () => {
    for (const name of NODE_ONLY_EXPORTS) {
      expect(name in contracts).toBe(false);
    }
  });

  test("files entry still exports the workspace fence", () => {
    for (const name of NODE_ONLY_EXPORTS) {
      expect(typeof files[name]).toBe("function");
    }
  });
});
