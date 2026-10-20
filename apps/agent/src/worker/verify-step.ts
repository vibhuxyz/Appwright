import {
  shouldRetryVerification,
  type VerifyOutcome,
} from "@repo/decision-engine";
import { verifyWorkspace } from "@repo/verify";
import { publishStatus } from "./persist";
import { attachVerification } from "./attach-verification";

export interface VerifyStepParams {
  sessionId: string;
  worktreeDir: string;
  maxAttempts: number;
  history: VerifyOutcome[];
}

export interface VerifyStepResult {
  passed: boolean;
  outputText: string;
  shouldRetry: boolean;
  stuck: boolean;
  results: unknown[];
}

export async function runVerifyStep(
  params: VerifyStepParams,
): Promise<VerifyStepResult> {
  const { sessionId, worktreeDir, maxAttempts, history } = params;
  publishStatus(sessionId, "RUNNING", "Verifying workspace changes…");
  const results = await verifyWorkspace(worktreeDir);
  await attachVerification(sessionId, results);

  const passed = results.every((r) => r.ok);
  const failure = results.find((r) => !r.ok);
  const outputText = failure
    ? failure.errors
        .map((e) => `${e.file ?? ""}:${e.line ?? 0}:${e.col ?? 0} ${e.message}`)
        .join("\n")
    : "";

  history.push({ passed, output: outputText });

  if (passed) {
    return { passed: true, outputText: "", shouldRetry: false, stuck: false, results };
  }

  const shouldRetry = shouldRetryVerification(history, maxAttempts);
  const stuck = history.at(-2)?.output === outputText;

  return { passed: false, outputText, shouldRetry, stuck, results };
}
