import type { VerificationResult } from "@repo/contracts";

const MAX_FILES_PER_CHECK = 3;
const MAX_SUMMARY_CHARS = 320;
const FILE_NAME_PATTERN = /[^/\\]+$/;

function locationOf(error: VerificationResult["errors"][number]): string | null {
  if (!error.file) return null;
  const name = FILE_NAME_PATTERN.exec(error.file)?.[0] ?? error.file;
  return error.line ? `${name}:${error.line}` : name;
}

function describeCheck(result: VerificationResult): string {
  const locations = [...new Set(result.errors.flatMap((error) => locationOf(error) ?? []))];
  const shown = locations.slice(0, MAX_FILES_PER_CHECK).join(", ");
  const more = locations.length > MAX_FILES_PER_CHECK ? ` and ${locations.length - MAX_FILES_PER_CHECK} more` : "";
  const count = `${result.errors.length} ${result.errors.length === 1 ? "error" : "errors"}`;
  return shown ? `${result.check} (${count}) in ${shown}${more}` : `${result.check} (${count})`;
}

export function summarizeVerificationFailure(results: readonly VerificationResult[]): string {
  const failed = results.filter((result) => !result.ok);
  if (failed.length === 0) return "";
  const text = `Failing: ${failed.map(describeCheck).join("; ")}.`;
  return text.length <= MAX_SUMMARY_CHARS ? text : `${text.slice(0, MAX_SUMMARY_CHARS - 1).trimEnd()}…`;
}
