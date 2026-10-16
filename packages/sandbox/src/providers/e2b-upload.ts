import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const EXCLUDED_DIRS = new Set(["node_modules", ".git", "dist", ".next", ".turbo"]);

// Local mode points the supervisor straight at the host's existing
// worktree directory. E2B has no shared filesystem with the host, so the
// same directory is uploaded into the box instead — git history excluded
// (thousands of loose objects would be slow to upload one write() at a
// time); a fresh `git init` + baseline commit inside the box gives the
// checkpoint step something to diff against.
export function collectUploadEntries(
  rootDir: string,
): { path: string; data: ArrayBuffer }[] {
  const entries: { path: string; data: ArrayBuffer }[] = [];

  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      if (EXCLUDED_DIRS.has(name)) continue;
      const fullPath = join(dir, name);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        const relativePath = relative(rootDir, fullPath);
        const buffer = readFileSync(fullPath);
        entries.push({
          path: relativePath,
          data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        });
      }
    }
  };

  walk(rootDir);
  return entries;
}
