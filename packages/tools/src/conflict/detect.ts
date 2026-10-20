import { $ } from "bun";
import { parseConflictedPaths } from "./parse-conflicts";
import { MAX_CONFLICT_FILES, MAX_SIDE_BYTES } from "./types";
import type { ConflictFile, ConflictReport } from "./types";

const MERGE_TREE_CONFLICT_EXIT_CODE = 1;
const MAIN_BRANCH = "main";

export async function listConflictedPaths(
  repoDir: string,
  branchName: string,
): Promise<string[]> {
  const result =
    await $`git -C ${repoDir} merge-tree --write-tree --name-only -z ${MAIN_BRANCH} ${branchName}`
      .quiet()
      .nothrow();
  if (result.exitCode === 0) return [];
  if (result.exitCode !== MERGE_TREE_CONFLICT_EXIT_CODE) {
    throw new Error(
      `Cannot check conflicts for ${branchName}: ${result.stderr.toString().trim()}`,
    );
  }
  return parseConflictedPaths(result.stdout.toString());
}

async function readSide(
  repoDir: string,
  ref: string,
  filePath: string,
): Promise<{ content: string | null; isTruncated: boolean }> {
  const result = await $`git -C ${repoDir} show ${`${ref}:${filePath}`}`
    .quiet()
    .nothrow();
  if (result.exitCode !== 0) return { content: null, isTruncated: false };
  const bytes = result.stdout;
  const isTruncated = bytes.byteLength > MAX_SIDE_BYTES;
  const slice = isTruncated ? bytes.subarray(0, MAX_SIDE_BYTES) : bytes;
  return { content: slice.toString("utf8"), isTruncated };
}

async function describeFile(
  repoDir: string,
  branchName: string,
  filePath: string,
): Promise<ConflictFile> {
  const [main, session] = await Promise.all([
    readSide(repoDir, MAIN_BRANCH, filePath),
    readSide(repoDir, branchName, filePath),
  ]);
  return {
    path: filePath,
    main: main.content,
    session: session.content,
    isTruncated: main.isTruncated || session.isTruncated,
  };
}

export async function detectConflicts(
  repoDir: string,
  branchName: string,
): Promise<ConflictReport> {
  const paths = await listConflictedPaths(repoDir, branchName);
  if (paths.length === 0) return { hasConflict: false };
  const shown = paths.slice(0, MAX_CONFLICT_FILES);
  const files = await Promise.all(
    shown.map((filePath) => describeFile(repoDir, branchName, filePath)),
  );
  return { hasConflict: true, files, skipped: paths.length - shown.length };
}
