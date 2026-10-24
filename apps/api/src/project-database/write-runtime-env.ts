import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  tryGetProjectRuntimeEnv,
  type ProjectDbEnvironment,
} from "@repo/db";
import { projectRepoPath, sessionWorktreePath } from "@repo/workspace";

function envFileContents(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n")
    .concat("\n");
}

export async function writeProjectRuntimeEnvFile(input: {
  projectId: string;
  environment?: ProjectDbEnvironment;
  worktreeSessionId?: string;
}): Promise<string | null> {
  const vars = await tryGetProjectRuntimeEnv({
    projectId: input.projectId,
    environment: input.environment ?? "development",
  });
  if (Object.keys(vars).length === 0) return null;

  const root = input.worktreeSessionId
    ? sessionWorktreePath(input.projectId, input.worktreeSessionId)
    : projectRepoPath(input.projectId);
  const dest = path.join(root, ".env.local");
  await writeFile(dest, envFileContents(vars), { mode: 0o600 });
  return dest;
}
