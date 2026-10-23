import { runBrowserCheck } from "@repo/browser";
import { BROWSER_CHECK_OPENING, browserCheckStatus } from "@repo/contracts";
import { createLogger } from "@repo/logger";
import { sessionBrowserReportPath } from "@repo/workspace";
import { createLiveFrameWriter, removeLiveFrame } from "./browser-live";
import { changedWorktreePaths } from "./browser-scope";
import { describeBrowserCheck } from "./describe-browser-check";
import { publishStatus } from "./persist";
import type { PersistFields } from "./persist";

const log = createLogger("browser-check");

export interface BrowserCheckStepParams {
  projectId: string;
  sessionId: string;
  worktreeDir: string;
  persist: (fields: PersistFields) => Promise<unknown>;
}

export function isBrowserCheckEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.BROWSER_CHECK !== "false";
}

export async function runBrowserCheckStep(params: BrowserCheckStepParams): Promise<void> {
  const { projectId, sessionId, worktreeDir, persist } = params;
  const outputDir = sessionBrowserReportPath(projectId, sessionId);
  const writer = createLiveFrameWriter(outputDir);
  await removeLiveFrame(outputDir);
  const changed = await changedWorktreePaths(worktreeDir);
  publishStatus(sessionId, "RUNNING", BROWSER_CHECK_OPENING);
  try {
    const result = await runBrowserCheck({
      workspaceDir: worktreeDir,
      outputDir,
      changedPaths: changed ?? ["src/app/layout.tsx"],
      live: {
        onFrame: (jpeg) => writer.push(jpeg),
        onActivity: (label) => publishStatus(sessionId, "RUNNING", browserCheckStatus(label)),
        onError: (reason) => log.warn("browser live view unavailable", { sessionId, reason }),
      },
    });
    const message = describeBrowserCheck(sessionId, result);
    const content = result.status === "checked"
      ? `Checked only what this prompt changed.\n${message.content}`
      : message.content;
    await persist({ role: "assistant", type: "text", content, data: message.data });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    log.error("browser check crashed", { sessionId, projectId, reason });
    await persist({
      role: "assistant",
      type: "text",
      content: `⚠️ Browser check could not run: ${reason}`,
      data: { browserCheck: { status: "skipped", reason } },
    });
  } finally {
    await writer.idle();
  }
}
