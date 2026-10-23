import path from "node:path";
import { sessionBrowserReportPath } from "@repo/workspace";

const SCREENSHOT_NAME = /^[a-z0-9][a-z0-9-]{0,120}\.png$/;

export function screenshotPath(projectId: string, sessionId: string, fileName: string): string | null {
  if (!SCREENSHOT_NAME.test(fileName)) return null;
  const root = sessionBrowserReportPath(projectId, sessionId);
  const resolved = path.resolve(root, fileName);
  return resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
}
