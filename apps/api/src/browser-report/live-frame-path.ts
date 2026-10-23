import path from "node:path";
import { sessionBrowserReportPath } from "@repo/workspace";

const LIVE_FRAME_NAME = "live.jpg";

function isSafeId(value: string): boolean {
  return value.length > 0 && !value.includes("/") && !value.includes("\\") && !value.includes("..");
}

export function liveFramePath(projectId: string, sessionId: string): string | null {
  if (!isSafeId(projectId) || !isSafeId(sessionId)) return null;
  const root = sessionBrowserReportPath(projectId, sessionId);
  const resolved = path.resolve(root, LIVE_FRAME_NAME);
  return resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
}
