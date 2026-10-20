import type { VerificationResult } from "@repo/contracts";
import type { VerifyOutcome } from "../types";

const MAX_ERRORS_SHOWN = 5;

export function toVerifyOutcome(results: readonly VerificationResult[]): VerifyOutcome {
  if (results.length === 0) return { ok: false, error: "Verification produced no results" };
  const failed = results.find((result) => !result.ok);
  if (!failed) return { ok: true };
  const messages = failed.errors.slice(0, MAX_ERRORS_SHOWN).map((error) => error.message);
  const hidden = failed.errors.length - MAX_ERRORS_SHOWN;
  const suffix = hidden > 0 ? ` (+${hidden} more)` : "";
  return { ok: false, error: `${failed.check} failed: ${messages.join("; ")}${suffix}` };
}
