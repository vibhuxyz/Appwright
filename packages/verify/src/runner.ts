import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";
import type { VerificationResult } from "@repo/contracts";
import { runInstall } from "./install";
import { parseBuildErrors, parseLintErrors, parseTscErrors } from "./parser";

function hasScript(cwd: string, script: string): boolean {
  const packageJsonPath = join(cwd, "package.json");
  if (!existsSync(packageJsonPath)) return false;
  try {
    const manifest: unknown = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    const scripts =
      typeof manifest === "object" && manifest !== null && "scripts" in manifest
        ? (manifest as { scripts?: unknown }).scripts
        : undefined;
    return (
      typeof scripts === "object" &&
      scripts !== null &&
      typeof (scripts as Record<string, unknown>)[script] === "string"
    );
  } catch {
    return false;
  }
}

export async function runTsc(cwd: string): Promise<VerificationResult> {
  if (!existsSync(join(cwd, "tsconfig.json"))) {
    return { ok: true, check: "tsc", errors: [] };
  }
  try {
    const output = await $`git -C ${cwd} rev-parse --is-inside-work-tree`
      .quiet()
      .then(async () => {
        return await $`bun x tsc --noEmit`
          .cwd(cwd)
          .text();
      });
    return { ok: true, check: "tsc", errors: parseTscErrors(output) };
  } catch (err: unknown) {
    const errorText = err instanceof Error && "stdout" in err
      ? String((err as { stdout: Buffer | string }).stdout)
      : String(err);
    const errors = parseTscErrors(errorText);
    return {
      ok: false,
      check: "tsc",
      errors: errors.length > 0 ? errors : [{ message: errorText.trim() }],
    };
  }
}

export async function runBuild(cwd: string): Promise<VerificationResult> {
  if (!hasScript(cwd, "build")) {
    return { ok: true, check: "build", errors: [] };
  }
  try {
    const output = await $`bun run build`.cwd(cwd).text();
    return { ok: true, check: "build", errors: parseBuildErrors(output) };
  } catch (err: unknown) {
    const errorText = err instanceof Error && "stdout" in err
      ? String((err as { stdout: Buffer | string }).stdout)
      : String(err);
    const errors = parseBuildErrors(errorText);
    return {
      ok: false,
      check: "build",
      errors: errors.length > 0 ? errors : [{ message: errorText.trim() }],
    };
  }
}

export async function runLint(cwd: string): Promise<VerificationResult> {
  if (!hasScript(cwd, "lint")) {
    return { ok: true, check: "lint", errors: [] };
  }
  try {
    const output = await $`bun run lint`.cwd(cwd).text();
    return { ok: true, check: "lint", errors: parseLintErrors(output) };
  } catch (err: unknown) {
    const errorText = err instanceof Error && "stdout" in err
      ? String((err as { stdout: Buffer | string }).stdout)
      : String(err);
    const errors = parseLintErrors(errorText);
    return {
      ok: false,
      check: "lint",
      errors: errors.length > 0 ? errors : [{ message: errorText.trim() }],
    };
  }
}

export async function verifyWorkspace(cwd: string): Promise<VerificationResult[]> {
  const installResult = await runInstall(cwd);
  if (!installResult.ok) {
    return [installResult];
  }
  const tscResult = await runTsc(cwd);
  if (!tscResult.ok) {
    return [tscResult];
  }
  const buildResult = await runBuild(cwd);
  if (!buildResult.ok) {
    return [tscResult, buildResult];
  }
  const lintResult = await runLint(cwd);
  return [tscResult, buildResult, lintResult];
}
