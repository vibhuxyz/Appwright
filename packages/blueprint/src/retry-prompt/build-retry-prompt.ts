import { VERIFICATION_FAILED_PREFIX } from "orchestrator";

const MAX_RETRY_ERROR_CHARS = 4_000;
const MAX_OWNED_PATHS = 40;

export interface RetryTask {
  readonly title: string;
  readonly owns: readonly string[];
}

export function isVerificationFailure(error: string | undefined): error is string {
  return error?.startsWith(VERIFICATION_FAILED_PREFIX) ?? false;
}

function ownedLines(owns: readonly string[]): string[] {
  const shown = owns.slice(0, MAX_OWNED_PATHS).map((path) => `- ${path}`);
  const hiddenCount = owns.length - shown.length;
  return hiddenCount > 0 ? [...shown, `(+${hiddenCount} more)`] : shown;
}

export function buildRetryPrompt(task: RetryTask, error: string): string {
  const details = error.slice(VERIFICATION_FAILED_PREFIX.length, VERIFICATION_FAILED_PREFIX.length + MAX_RETRY_ERROR_CHARS);
  return [
    `Task: ${task.title}`,
    "Your previous attempt finished and its files are still in place, but verification found these errors:",
    "<verification-errors>",
    details.replaceAll("</verification-errors>", "<\\/verification-errors>"),
    "</verification-errors>",
    "Fix only these errors. Read the files involved first, change as little as possible, and do not rewrite working code.",
    "Files you may edit:",
    ...ownedLines(task.owns),
  ].join("\n");
}
