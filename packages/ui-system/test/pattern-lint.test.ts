import { describe, expect, it } from "bun:test";
import { cp, rm } from "node:fs/promises";
import path from "node:path";

const PACKAGE_ROOT = path.resolve(import.meta.dir, "..");
const TEMPLATE_DIR = path.resolve(PACKAGE_ROOT, "../../templates/nextjs-fullstack");
const LINT_DIR = path.join(TEMPLATE_DIR, "src/components/zz-pattern-lint");
const LINT_TIMEOUT_MS = 120_000;
const ERROR_SEVERITY = 2;

interface LintMessage {
  readonly severity: number;
  readonly ruleId: string | null;
  readonly line: number;
  readonly message: string;
}

interface LintFile {
  readonly filePath: string;
  readonly messages: readonly LintMessage[];
}

async function lintPatterns(): Promise<string[]> {
  await rm(LINT_DIR, { recursive: true, force: true });
  await cp(path.join(PACKAGE_ROOT, "patterns"), LINT_DIR, { recursive: true });
  try {
    const run = Bun.spawn(["bunx", "eslint", "src/components/zz-pattern-lint", "-f", "json"], { cwd: TEMPLATE_DIR, stdout: "pipe", stderr: "ignore" });
    const files = JSON.parse(await new Response(run.stdout).text()) as LintFile[];
    return files.flatMap((file) =>
      file.messages
        .filter((message) => message.severity === ERROR_SEVERITY)
        .map((message) => `${path.relative(LINT_DIR, file.filePath)}:${message.line} ${message.ruleId ?? ""} ${message.message.split("\n")[0] ?? ""}`),
    );
  } finally {
    await rm(LINT_DIR, { recursive: true, force: true });
  }
}

describe("shipped patterns under the generated project's ESLint", () => {
  it("have no lint errors, because verification fails every site that ships one", async () => {
    expect(await lintPatterns()).toEqual([]);
  }, LINT_TIMEOUT_MS);
});
