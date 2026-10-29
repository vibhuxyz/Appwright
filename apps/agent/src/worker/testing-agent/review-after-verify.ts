import { OpenAiProvider, type VisualIssue } from "@repo/agent-core";
import type { BrowserCheckResult } from "@repo/browser";
import { createLogger } from "@repo/logger";
import { isBrowserCheckEnabled, runBrowserCheckStep } from "../browser-check-step";
import { createRepairTurn, planRepair, reviewNewPages, runBrowserRepair } from "../browser-repair";
import { worktreeChangeScope } from "../browser-scope";
import { publishStatus } from "../persist";
import { DELEGATED_STATUS, FINISHED_STATUS } from "./constants";
import { measuredMustFix, testingEvidence } from "./evidence";
import { decideRepair } from "./parse-review";
import { formatTestingRepairPrompt } from "./prompt";
import { runTestingAgent } from "./run-testing-agent";
import type { ReviewInput, ReviewOutcome, TestingReview } from "./types";

const log = createLogger("testing-agent");
const SUMMARY_NOTE_CHARS = 180;

interface BrowserBundle {
  readonly check: BrowserCheckResult | undefined;
  readonly issues: readonly VisualIssue[];
}

function codingProvider(input: ReviewInput) {
  return input.provider ?? new OpenAiProvider({ model: input.sessionModel });
}

async function loadBrowser(input: ReviewInput): Promise<BrowserBundle> {
  if (!(input.browserEnabled ?? isBrowserCheckEnabled())) return { check: undefined, issues: [] };
  const params = { projectId: input.projectId, sessionId: input.sessionId, worktreeDir: input.worktreeDir, persist: input.persist };
  const check = await runBrowserCheckStep(params);
  return { check, issues: await reviewNewPages({ check, ...params }) };
}

function summaryNotes(review: TestingReview | undefined, measured: readonly string[]): string {
  if (measured.length > 0 && review?.status === "pass") return "Measured browser problems still need a fix.";
  if (!review) return "Testing agent did not return a review.";
  return review.notes;
}

async function repairOnce(input: ReviewInput, mustFix: readonly string[], measured: readonly string[], browser: BrowserBundle, changedPaths: readonly string[]): Promise<boolean> {
  const repairTurn = input.repairTurn ?? createRepairTurn({
    messages: input.messages,
    provider: codingProvider(input),
    runtime: input.runtime,
    emit: input.emit,
    signal: input.signal,
    sessionId: input.sessionId,
    userId: input.userId,
    worktreeDir: input.worktreeDir,
  });
  const findings = browser.check?.status === "checked" ? browser.check.report.findings : [];
  const plan = planRepair(findings, browser.issues);
  if (plan && browser.check) {
    const known = new Set(measured);
    const extraMustFix = mustFix.filter((item) => !known.has(item));
    const outcome = await runBrowserRepair({
      check: browser.check,
      issues: browser.issues,
      changedPaths,
      ...(extraMustFix.length > 0 ? { extraMustFix } : {}),
      persist: input.persist,
      recheck: (scope) => runBrowserCheckStep({ projectId: input.projectId, sessionId: input.sessionId, worktreeDir: input.worktreeDir, persist: input.persist, recheck: scope }),
      runRepairTurn: repairTurn,
    });
    log.info("testing repair", { sessionId: input.sessionId, outcome });
    return outcome === "fixed";
  }
  const prompt = formatTestingRepairPrompt(mustFix, changedPaths);
  await input.persist({ role: "user", type: "text", content: prompt, data: { verificationRetry: true, testingRepair: true } });
  const passed = await repairTurn(prompt);
  const content = passed
    ? "✅ The testing repair passed verification."
    : "❌ The testing repair did not pass typecheck and build, so the must-fix items remain.";
  await input.persist({ role: "assistant", type: "text", content });
  log.info("testing repair", { sessionId: input.sessionId, outcome: passed ? "fixed" : "repair-failed" });
  return passed;
}

export async function reviewAfterVerification(input: ReviewInput): Promise<ReviewOutcome> {
  if (input.signal.aborted) return { passed: false, notes: "" };
  const publish = input.publish ?? ((detail: string) => publishStatus(input.sessionId, "RUNNING", detail));
  const changedPaths = (await worktreeChangeScope(input.worktreeDir))?.changedPaths ?? [];
  const browser = await loadBrowser(input);
  publish(DELEGATED_STATUS);
  const evidence = testingEvidence({ verifyResults: input.verifyResults, check: browser.check, issues: browser.issues, changedPaths });
  const review = input.signal.aborted ? undefined : await runTestingAgent({ evidence, review: input, nowMs: Date.now() });
  publish(FINISHED_STATUS);
  const measured = measuredMustFix(browser.check, browser.issues);
  const decision = decideRepair(review, measured);
  const notes = summaryNotes(review, measured).slice(0, SUMMARY_NOTE_CHARS);
  await input.persist({
    role: "assistant",
    type: "text",
    content: `Testing Agent: ${decision.status}.${notes.length > 0 ? ` ${notes}` : ""}`,
    data: { transcriptOnly: true, testingAgent: true, delegation: "Testing Agent", status: decision.status },
  });
  if (input.signal.aborted) return { passed: false, notes };
  if (decision.mustFix.length === 0) return { passed: true, notes };
  const repaired = await repairOnce(input, decision.mustFix, measured, browser, changedPaths);
  return { passed: repaired && !input.signal.aborted, notes };
}
