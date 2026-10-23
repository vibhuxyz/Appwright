import { existsSync } from "node:fs";
import { lstat, unlink } from "node:fs/promises";
import { join } from "node:path";
import type { VerificationResult } from "@repo/contracts";

export const INSTALL_TIMEOUT_MS = 180_000;
const MAX_INSTALL_OUTPUT_CHARS = 2_000;

function isNotFound(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function unlinkNodeModulesSymlink(cwd: string): Promise<void> {
  const modulesPath = join(cwd, "node_modules");
  try {
    if ((await lstat(modulesPath)).isSymbolicLink()) await unlink(modulesPath);
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }
}

export async function runInstall(
  cwd: string,
  timeoutMs: number = INSTALL_TIMEOUT_MS,
): Promise<VerificationResult> {
  if (!existsSync(join(cwd, "package.json"))) {
    return { ok: true, check: "install", errors: [] };
  }
  await unlinkNodeModulesSymlink(cwd);
  const proc = Bun.spawn(["bun", "install"], {
    cwd,
    stdout: "ignore",
    stderr: "pipe",
    timeout: timeoutMs,
  });
  const [exitCode, stderr] = await Promise.all([proc.exited, new Response(proc.stderr).text()]);
  if (exitCode === 0) return { ok: true, check: "install", errors: [] };
  const detail = stderr.trim().slice(-MAX_INSTALL_OUTPUT_CHARS);
  return {
    ok: false,
    check: "install",
    errors: [{ message: `bun install failed (exit ${exitCode}) in ${cwd}: ${detail}` }],
  };
}
