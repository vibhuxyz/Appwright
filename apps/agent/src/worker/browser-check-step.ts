import { runBrowserCheck, type BrowserCheckResult, type BrowserRecheck, type ChangeRisk } from "@repo/browser";
import { BROWSER_CHECK_OPENING, browserCheckStatus } from "@repo/contracts";
import { createLogger } from "@repo/logger";
import { sessionBrowserReportPath } from "@repo/workspace";
import { createLiveFrameWriter, removeLiveFrame } from "./browser-live";
import { worktreeChangeScope } from "./browser-scope";
import { describeBrowserCheck } from "./describe-browser-check";
import { publishStatus } from "./persist";
import type { PersistFields } from "./persist";

const log = createLogger("browser-check");
const FALLBACK_SCOPE = { changedPaths: ["src/app/layout.tsx"], addedPaths: [] };
const RISK_LABEL: Readonly<Record<ChangeRisk, string>> = {
  none: "no UI change",
  functional: "logic-only change, desktop only",
  visual: "UI change, mobile and desktop",
  page: "new page, every screen size",
};

export interface BrowserCheckStepParams {
  projectId: string;
  sessionId: string;
  worktreeDir: string;
  persist: (fields: PersistFields) => Promise<unknown>;
  recheck?: BrowserRecheck;
}

export function isBrowserCheckEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.BROWSER_CHECK !== "false";
}

function introFor(result: BrowserCheckResult, isRecheck: boolean): string {
  if (result.status !== "checked") return "";
  if (isRecheck) return `Rechecked only the pages and screen sizes that had problems.\n`;
  return `Checked only what this prompt changed (${RISK_LABEL[result.risk]}).\n`;
}

export async function runBrowserCheckStep(params: BrowserCheckStepParams): Promise<BrowserCheckResult | undefined> {
  const { projectId, sessionId, worktreeDir, persist, recheck } = params;
  const outputDir = sessionBrowserReportPath(projectId, sessionId);
  const writer = createLiveFrameWriter(outputDir);
  await removeLiveFrame(outputDir);
  const scope = recheck ? undefined : ((await worktreeChangeScope(worktreeDir)) ?? FALLBACK_SCOPE);
  publishStatus(sessionId, "RUNNING", BROWSER_CHECK_OPENING);
  try {
    const result = await runBrowserCheck({
      workspaceDir: worktreeDir,
      outputDir,
      ...(scope ? { scope } : {}),
      ...(recheck ? { recheck } : {}),
      live: {
        onFrame: (jpeg) => writer.push(jpeg),
        onActivity: (label) => publishStatus(sessionId, "RUNNING", browserCheckStatus(label)),
        onError: (reason) => log.warn("browser live view unavailable", { sessionId, reason }),
      },
    });
    const message = describeBrowserCheck(sessionId, result);
    await persist({ role: "assistant", type: "text", content: `${introFor(result, recheck !== undefined)}${message.content}`, data: message.data });
    return result;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    log.error("browser check crashed", { sessionId, projectId, reason });
    await persist({
      role: "assistant",
      type: "text",
      content: `⚠️ Browser check could not run: ${reason}`,
      data: { browserCheck: { status: "skipped", reason } },
    });
    return undefined;
  } finally {
    await writer.idle();
  }
}
