import type { VerificationResult } from "@repo/contracts";
import { HANDOFF_PATH, MAX_CHANGED_FILES } from "./constants";

const CONTEXT_TAG = "handoff-context";

function verificationLines(results: readonly VerificationResult[]): string[] {
  if (results.length === 0) return ["Verification passed."];
  return results.map((result) => `${result.check} ${result.ok ? "passed" : "failed"}`);
}

function section(title: string, lines: readonly string[]): string[] {
  if (lines.length === 0) return [];
  return ["", title, ...lines];
}

export function handoffPrompt(input: {
  readonly memory: string;
  readonly verifyResults: readonly VerificationResult[];
  readonly testingNotes: string;
  readonly commit: string;
  readonly changedPaths: readonly string[];
}): string {
  const files = [...input.changedPaths].sort().slice(0, MAX_CHANGED_FILES).map((path) => `- ${path}`);
  const body = [
    `Last commit: ${input.commit}`,
    "",
    "Verification:",
    ...verificationLines(input.verifyResults),
    ...section("Testing notes:", input.testingNotes ? [input.testingNotes] : []),
    ...section("Changed files:", files),
    ...section("Project memory:", input.memory ? [input.memory] : []),
  ].join("\n");
  return [
    "You are the handoff agent. You do not change the app.",
    `Write or update ${HANDOFF_PATH} with what was built, the key decisions, the open items, and how to continue.`,
    "Use write_file for that path only. Then stop.",
    "The file is a note for the user. Do not add new product requirements.",
    "",
    `<${CONTEXT_TAG}>`,
    body.replaceAll(`</${CONTEXT_TAG}>`, `<\\/${CONTEXT_TAG}>`),
    `</${CONTEXT_TAG}>`,
    "",
    'After the write, return only JSON: {"title":"short title","bullets":["what was built"],"note":"optional remaining detail"}',
  ].join("\n");
}
