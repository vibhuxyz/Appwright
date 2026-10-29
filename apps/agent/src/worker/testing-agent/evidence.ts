import type { VisualIssue } from "@repo/agent-core";
import type { BrowserCheckResult, Finding } from "@repo/browser";
import type { VerificationResult } from "@repo/contracts";
import { blockingFindings } from "../browser-repair";
import { MAX_CHANGED_FILES, MAX_FIX_CHARS, MAX_LISTED, MAX_MUST_FIX } from "./constants";
import { clip } from "./text";
import type { TestingEvidence } from "./types";

function verificationLines(results: readonly VerificationResult[]): string[] {
  if (results.length === 0) return ["Verification passed."];
  return results.map((result) => `${result.check} ${result.ok ? "passed" : "failed"}`);
}

function routesOf(check: BrowserCheckResult | undefined): string[] {
  if (!check || check.status !== "checked") return [];
  return [...check.report.routes].sort().slice(0, MAX_LISTED);
}

function findingLine(finding: Finding): string {
  return clip(`${finding.route} (${finding.viewport}) ${finding.kind}: ${finding.message}`, MAX_FIX_CHARS);
}

export function testingEvidence(input: {
  readonly verifyResults: readonly VerificationResult[];
  readonly check: BrowserCheckResult | undefined;
  readonly issues: readonly VisualIssue[];
  readonly changedPaths: readonly string[];
}): TestingEvidence {
  const findings = input.check?.status === "checked" ? [...input.check.report.findings] : [];
  findings.sort((left, right) => left.route.localeCompare(right.route) || left.viewport.localeCompare(right.viewport) || left.kind.localeCompare(right.kind));
  const notes = [...input.issues].sort((left, right) => left.route.localeCompare(right.route) || left.viewport.localeCompare(right.viewport));
  return {
    verification: verificationLines(input.verifyResults),
    routes: routesOf(input.check),
    changedPaths: [...input.changedPaths].sort().slice(0, MAX_CHANGED_FILES),
    findings: findings.slice(0, MAX_LISTED).map(findingLine),
    visualNotes: notes.slice(0, MAX_LISTED).map((issue) => clip(`${issue.route} (${issue.viewport}) ${issue.severity}: ${issue.problem}`, MAX_FIX_CHARS)),
  };
}

export function measuredMustFix(check: BrowserCheckResult | undefined, issues: readonly VisualIssue[]): string[] {
  const findings = check?.status === "checked" ? blockingFindings(check.report.findings) : [];
  const severe = issues.filter((issue) => issue.severity === "severe");
  return [
    ...findings.map((finding) => clip(`[browser] ${finding.route} (${finding.viewport}) ${finding.kind}: ${finding.message}`, MAX_FIX_CHARS)),
    ...severe.map((issue) => clip(`[visual] ${issue.route} (${issue.viewport}) ${issue.area}: ${issue.problem}`, MAX_FIX_CHARS)),
  ].slice(0, MAX_MUST_FIX);
}
