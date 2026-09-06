// Re-export safeResolve/workspaceRoot from @repo/contracts (per the version
// doc: "import it, do not write a second one" — two fences that disagree
// about what a workspace is put files where the UI can't see them).
export { safeResolve, workspaceRoot } from "@repo/contracts";

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
