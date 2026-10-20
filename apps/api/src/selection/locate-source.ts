import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import type { ElementSelection } from "@repo/contracts";
import {
  MAX_SCANNED_FILE_BYTES,
  MAX_SCANNED_FILES,
  SCANNED_EXTENSIONS,
  SKIPPED_DIRECTORIES,
} from "./constants";
import { rankCandidates } from "./rank-candidates";
import type { SourceCandidate, SourceFile } from "./types";

function isNotFound(error: unknown): boolean {
  return error instanceof Error && "code" in error && (error.code === "ENOENT" || error.code === "ENOTDIR");
}

async function listSourcePaths(root: string): Promise<string[]> {
  const found: string[] = [];
  const pending = [root];
  while (pending.length > 0 && found.length < MAX_SCANNED_FILES) {
    const directory = pending.pop();
    if (directory === undefined) break;
    const listing = await readdir(directory, { withFileTypes: true }).catch((error: unknown) => {
      if (isNotFound(error)) return [];
      throw error;
    });
    const entries = listing.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const full = join(directory, entry.name);
      if (entry.isDirectory() && !SKIPPED_DIRECTORIES.has(entry.name)) pending.push(full);
      else if (entry.isFile() && SCANNED_EXTENSIONS.test(entry.name)) found.push(full);
    }
  }
  return found.slice(0, MAX_SCANNED_FILES);
}

async function readSourceFile(root: string, fullPath: string): Promise<SourceFile | undefined> {
  const info = await stat(fullPath);
  if (info.size > MAX_SCANNED_FILE_BYTES) return undefined;
  return { path: relative(root, fullPath), content: await readFile(fullPath, "utf8") };
}

export async function locateSelectionSource(
  worktreeDir: string,
  selection: ElementSelection,
): Promise<SourceCandidate[]> {
  const paths = await listSourcePaths(join(worktreeDir, "src"));
  const files = await Promise.all(paths.map((path) => readSourceFile(worktreeDir, path)));
  return rankCandidates(
    files.filter((file): file is SourceFile => file !== undefined),
    selection,
  );
}
