import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dir, "../../..");
export const WORKSPACES_DIR = process.env.WORKSPACE_ROOT
  ? path.resolve(REPO_ROOT, process.env.WORKSPACE_ROOT)
  : path.resolve(REPO_ROOT, ".workspaces");

export function workspacePath(projectId: string): string {
  return path.join(WORKSPACES_DIR, projectId);
}

export function projectRepoPath(projectId: string): string {
  return path.join(workspacePath(projectId), "repo");
}

export function sessionWorktreePath(
  projectId: string,
  sessionId: string,
): string {
  return path.join(workspacePath(projectId), `session-${sessionId}`);
}

export function sessionBrowserReportPath(
  projectId: string,
  sessionId: string,
): string {
  return path.join(workspacePath(projectId), "browser-reports", sessionId);
}

export {
  applyComposition,
  planComposition,
  withThemeImport,
  GLOBALS_CSS_PATH,
  THEME_CSS_PATH,
  type ApplyOptions,
  type ApplyResult,
  type ComposeInput,
  type ComposePlan,
  type FileWrite,
  type SkippedInput,
} from "./compose";

