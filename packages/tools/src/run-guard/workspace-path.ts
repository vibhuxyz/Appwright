import { posix } from "node:path";

const LEADING_CURRENT_DIR = /^(?:\.\/)+/;

export function normalizeWorkspacePath(path: string): string {
  return posix.normalize(path.replaceAll("\\", "/")).replace(LEADING_CURRENT_DIR, "");
}

export function pathArg(args: unknown): string | undefined {
  if (typeof args !== "object" || args === null || !("path" in args)) return undefined;
  return typeof args.path === "string" ? normalizeWorkspacePath(args.path) : undefined;
}
