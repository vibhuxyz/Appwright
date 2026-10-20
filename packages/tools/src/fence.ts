// Re-export safeResolve/workspaceRoot from @repo/contracts (per the version
// doc: "import it, do not write a second one" — two fences that disagree
// about what a workspace is put files where the UI can't see them).
export { safeResolve, workspaceRoot } from "@repo/contracts/files";

// TODO(Slice 3, together): the deny-list is ADDITIONAL to safeResolve's
// escape check — a path can be perfectly inside the workspace and still be
// a secret (.env, .env.*, **/.git/**, *.pem, id_rsa*).
const DENY_PATTERNS = [
  /(^|\/)\.env(\..*)?$/,
  /(^|\/)\.git\//,
  /\.pem$/,
  /id_rsa/,
];

export function isDenied(relPath: string): boolean {
  return DENY_PATTERNS.some((pattern) => pattern.test(relPath));
}

/** Generated shadcn primitives vendored into every template. Same files, every project. */
export function isGeneratedUiPrimitive(relPath: string): boolean {
  const normalized = relPath.replaceAll("\\", "/");
  return /(^|\/)src\/components\/ui\//.test(normalized);
}

export function uiPrimitiveImportPath(relPath: string): string {
  const normalized = relPath.replaceAll("\\", "/");
  const file = normalized
    .replace(/^.*src\/components\/ui\//, "")
    .replace(/\.[^./]+$/, "");
  return `@/components/ui/${file}`;
}
