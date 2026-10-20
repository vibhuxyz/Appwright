import type { Sandbox } from "@repo/sandbox";
import type { RestoreOutcome } from "./types";

type ExecSandbox = Pick<Sandbox, "exec">;

export interface RestoreWorkspaceOptions {
  readonly remoteUrl: string | undefined;
}

async function trackedFileCount(sandbox: ExecSandbox): Promise<number> {
  const listed = await sandbox.exec({ argv: ["git", "ls-files"] });
  if (listed.code !== 0) return 0;
  return listed.stdout.split("\n").filter((line) => line.trim().length > 0).length;
}

async function headSha(sandbox: ExecSandbox): Promise<string | undefined> {
  const head = await sandbox.exec({ argv: ["git", "rev-parse", "HEAD"] });
  return head.code === 0 ? head.stdout.trim() : undefined;
}

async function runStep(sandbox: ExecSandbox, argv: string[]): Promise<string | undefined> {
  const result = await sandbox.exec({ argv });
  if (result.code === 0) return undefined;
  return `${argv.join(" ")} exited ${result.code}: ${result.stderr.trim()}`;
}

export async function restoreWorkspace(
  sandbox: ExecSandbox,
  options: RestoreWorkspaceOptions,
): Promise<RestoreOutcome> {
  const existingSha = await headSha(sandbox);
  if (existingSha && (await trackedFileCount(sandbox)) > 0) {
    return { kind: "intact", sha: existingSha };
  }
  if (!options.remoteUrl) return { kind: "nothing-to-restore" };

  await sandbox.exec({ argv: ["git", "remote", "remove", "origin"] });
  const steps = [
    ["git", "remote", "add", "origin", options.remoteUrl],
    ["git", "fetch", "origin", "HEAD"],
    ["git", "reset", "--hard", "FETCH_HEAD"],
  ];
  for (const argv of steps) {
    const failure = await runStep(sandbox, argv);
    if (failure) return { kind: "failed", reason: `Cannot restore workspace: ${failure}` };
  }

  const restoredSha = await headSha(sandbox);
  if (!restoredSha) return { kind: "failed", reason: "Cannot restore workspace: no HEAD after reset" };
  return { kind: "restored", sha: restoredSha };
}
