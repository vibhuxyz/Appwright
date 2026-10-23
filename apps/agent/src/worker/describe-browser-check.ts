import { formatReport, hasErrors, type BrowserCheckResult } from "@repo/browser";

export interface BrowserCheckMessage {
  readonly content: string;
  readonly data: Record<string, unknown>;
}

export function screenshotUrlFor(sessionId: string, fileName: string): string {
  return `/v1/sessions/${sessionId}/browser-screenshots/${fileName}`;
}

export function describeBrowserCheck(sessionId: string, result: BrowserCheckResult): BrowserCheckMessage {
  switch (result.status) {
    case "checked": {
      const content = formatReport(result.report, {
        screenshotUrl: (fileName) => screenshotUrlFor(sessionId, fileName),
      });
      const skipped = result.skippedRoutes.map((route) => `${route.path} (${route.reason})`);
      const skippedNote = skipped.length > 0 ? `\nNot opened: ${skipped.join("; ")}` : "";
      return {
        content: `${content}${skippedNote}`,
        data: {
          browserCheck: {
            status: "checked",
            passed: !hasErrors(result.report),
            findings: result.report.findings,
            screenshots: result.report.screenshots,
          },
        },
      };
    }
    case "skipped":
      return {
        content: `⚠️ Browser check skipped: ${result.reason}`,
        data: { browserCheck: { status: "skipped", reason: result.reason } },
      };
    case "app-failed":
      return {
        content: `❌ Browser check could not open the built app: ${result.reason}`,
        data: { browserCheck: { status: "app-failed", reason: result.reason } },
      };
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
}
