import type { VerificationResult } from "@repo/contracts";
import { MAX_REPAIR_ERROR_LINES } from "../constants";

function errorLine(error: VerificationResult["errors"][number]): string {
  const location = error.file ? `${error.file}${error.line === undefined ? "" : `:${error.line}`}: ` : "";
  return `- ${location}${error.message.replace(/\s+/g, " ").trim()}`;
}

export function repairMessage(result: VerificationResult): string {
  const lines = result.errors.slice(0, MAX_REPAIR_ERROR_LINES).map(errorLine);
  const hiddenCount = result.errors.length - lines.length;
  return [
    "Running verification checks on your changes found real errors — fix them, then",
    "stop. Do not describe the fix, make it with edit_file/write_file.",
    "",
    `${result.check} errors:`,
    ...lines,
    ...(hiddenCount > 0 ? [`(+${hiddenCount} more)`] : []),
  ].join("\n");
}
