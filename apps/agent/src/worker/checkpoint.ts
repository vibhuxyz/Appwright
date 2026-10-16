import type { Sandbox } from "@repo/sandbox";

// Commit always runs inside the sandbox (the boundary: no node:fs from this
// process touching the workspace). Push is best-effort — a remote only
// exists once a project is wired to one; without it, "durable storage" is
// just the sandbox's own disk, which is exactly the case this checkpoint
// can't protect against (D17's "a commit that only exists on a dying
// sandbox's disk is worth nothing"). Flagged under OPEN, not silently
// swallowed as success.
export async function checkpointSession(
  sandbox: Sandbox,
  prompt: string,
): Promise<{ committed: boolean; pushed: boolean }> {
  const firstLine = (prompt.split("\n")[0] ?? "").trim().slice(0, 60);

  await sandbox.exec({ argv: ["git", "add", "."] });
  const commit = await sandbox.exec({
    argv: ["git", "commit", "-m", `agent: ${firstLine}`],
  });
  const committed = commit.code === 0;

  if (!committed) return { committed: false, pushed: false };

  const remote = await sandbox.exec({
    argv: ["git", "remote", "get-url", "origin"],
  });
  if (remote.code !== 0) return { committed: true, pushed: false };

  const push = await sandbox.exec({ argv: ["git", "push", "origin", "HEAD"] });
  return { committed: true, pushed: push.code === 0 };
}
