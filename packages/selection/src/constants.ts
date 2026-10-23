export const MAX_CANDIDATES = 5;
export const MAX_SCANNED_FILES = 400;
export const MAX_SCANNED_FILE_BYTES = 200_000;
export const SCANNED_EXTENSIONS = /\.(tsx|jsx)$/;
export const SKIPPED_DIRECTORIES: ReadonlySet<string> = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
]);
export const TEXT_MATCH_SCORE = 5;
export const MIN_TEXT_LENGTH = 3;
export const MAX_TEXT_PROBE_CHARS = 60;
export const MAX_CLASS_TOKENS = 12;
