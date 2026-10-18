const BACKSLASH = /\\/g;
const REPEATED_SLASH = /\/+/g;
const CURRENT_DIR_PREFIX = /^(?:\.\/)+/;
const TRAILING_SLASH = /\/$/;

export type NormalizedPath =
  | { ok: true; path: string }
  | { ok: false; reason: string };

export function normalizeWorkspacePath(raw: string): NormalizedPath {
  if (raw.includes("\0")) return { ok: false, reason: "contains a null byte" };
  const unified = raw.replace(BACKSLASH, "/").replace(REPEATED_SLASH, "/");
  if (unified.startsWith("/")) return { ok: false, reason: "absolute paths are not allowed" };
  const path = unified.replace(CURRENT_DIR_PREFIX, "").replace(TRAILING_SLASH, "");
  if (!path) return { ok: false, reason: "resolves to the workspace root" };
  const hasDotSegment = path.split("/").some((segment) => segment === ".." || segment === ".");
  if (hasDotSegment) return { ok: false, reason: "'.' and '..' segments are not allowed" };
  return { ok: true, path };
}
