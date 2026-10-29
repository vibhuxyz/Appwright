import { MAX_CHANGED_FILES, MAX_FIX_CHARS, MAX_MUST_FIX, MAX_PROMPT_BYTES } from "./constants";
import { clip } from "./text";
import type { TestingEvidence } from "./types";

const REPORT_TAG = "testing-report";

function section(title: string, lines: readonly string[]): string[] {
  if (lines.length === 0) return [];
  return ["", title, ...lines];
}

function clipReport(text: string): string {
  if (Buffer.byteLength(text, "utf8") <= MAX_PROMPT_BYTES) return text;
  const lines = text.split("\n");
  while (lines.length > 1 && Buffer.byteLength(lines.join("\n"), "utf8") > MAX_PROMPT_BYTES) lines.pop();
  const kept = lines.join("\n");
  return Buffer.byteLength(kept, "utf8") <= MAX_PROMPT_BYTES ? `${kept}\n(report trimmed)` : "(report trimmed)";
}

export function testingPrompt(evidence: TestingEvidence): string {
  const body = [
    "Verification:",
    ...evidence.verification,
    ...section("Routes:", evidence.routes.map((route) => `- ${route}`)),
    ...section("Changed files:", evidence.changedPaths.map((path) => `- ${path}`)),
    ...section("Browser findings:", evidence.findings.map((line) => `- ${line}`)),
    ...section("Visual review (AI judgement):", evidence.visualNotes.map((line) => `- ${line}`)),
  ].join("\n");
  return [
    "You are the testing agent. You review; you do not edit files.",
    "Use read_file and grep only when a finding names a file you need. Read each file once.",
    "Review the verification output and browser findings. Return a short pass or fail and any must-fix items.",
    "A must-fix item is a concrete defect a coder must change. Do not list style preferences.",
    "",
    `<${REPORT_TAG}>`,
    clipReport(body).replaceAll(`</${REPORT_TAG}>`, `<\\/${REPORT_TAG}>`),
    `</${REPORT_TAG}>`,
    "",
    'Return only JSON: {"status":"pass","notes":"...","mustFix":[]}',
    'Use "fail" and one mustFix string per defect. Use "pass" with an empty mustFix when nothing must change.',
  ].join("\n");
}

export function formatTestingRepairPrompt(mustFix: readonly string[], changedPaths: readonly string[]): string {
  const fixes = mustFix.slice(0, MAX_MUST_FIX).map((item) => `- ${clip(item, MAX_FIX_CHARS).replaceAll("</must-fix>", "<\\/must-fix>")}`);
  const files = [...changedPaths].sort().slice(0, MAX_CHANGED_FILES).map((path) => `- ${clip(path, MAX_FIX_CHARS)}`);
  return [
    "The testing agent found these must-fix items. Fix the cause in the source, then stop.",
    "Do not describe the fix. Make it with edit_file or write_file.",
    "<must-fix>",
    ...fixes,
    "</must-fix>",
    ...(files.length > 0 ? ["", "Files changed in this run:", ...files] : []),
    "",
    "Change only the code that causes these items.",
  ].join("\n");
}
