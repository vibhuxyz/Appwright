import { writeFile } from "node:fs/promises";
import path from "node:path";
import { tryGetProjectRuntimeEnv } from "@repo/db";
import { createLogger } from "@repo/logger";
import { sessionWorktreePath } from "@repo/workspace";
import type { Runtime } from "@repo/agent-core";

const log = createLogger("agent-job");

function envFileContents(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n")
    .concat("\n");
}

export async function injectProjectRuntimeEnv(input: {
  projectId: string;
  sessionId: string;
  runtime: Runtime;
}): Promise<void> {
  const vars = await tryGetProjectRuntimeEnv({
    projectId: input.projectId,
    environment: "development",
  });
  if (Object.keys(vars).length === 0) return;

  const contents = envFileContents(vars);
  const hostPath = path.join(
    sessionWorktreePath(input.projectId, input.sessionId),
    ".env.local",
  );
  await writeFile(hostPath, contents, { mode: 0o600 });
  try {
    await input.runtime.writeFile(".env.local", contents);
  } catch (err) {
    log.warn("sandbox env write failed", {
      projectId: input.projectId,
      sessionId: input.sessionId,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
