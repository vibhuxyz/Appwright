import { $ } from "bun";

export interface GitRun {
  readonly ok: boolean;
  readonly stdout: string;
  readonly stderr: string;
}

export async function git(dir: string, args: readonly string[]): Promise<GitRun> {
  const result = await $`git -C ${dir} ${args}`.quiet().nothrow();
  return { ok: result.exitCode === 0, stdout: result.stdout.toString().trim(), stderr: result.stderr.toString().trim() };
}

export function lastLine(text: string): string {
  return text.split("\n").at(-1) ?? text;
}

export const ENV_FILES_EXCLUDED = ":(exclude,glob)**/.env*";
