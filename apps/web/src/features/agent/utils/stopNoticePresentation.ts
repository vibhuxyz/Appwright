import { AGENT_LOOP_LIMITS, creditsToUsd } from "@repo/contracts";
import type { StopNotice } from "../schemas/agentSchemas";

const VERIFICATION_DETAIL = /verification/i;
const LEADING_SYMBOLS = /^[^\w]+/;

export function isVerificationFailure(notice: StopNotice): boolean {
  return notice.reason === "fatalError" && VERIFICATION_DETAIL.test(notice.detail);
}

export function stopNoticeIcon(reason: string): string {
  switch (reason) {
    case "outOfCredits":
      return "🪙";
    case "budgetExceeded":
      return "⚠️";
    case "cancelled":
      return "⏹";
    case "fatalError":
      return "❌";
    default:
      return "⏱️";
  }
}

export function stopNoticeBannerClass(reason: string): string {
  switch (reason) {
    case "outOfCredits":
    case "fatalError":
      return "border-danger/30 bg-danger/10 text-danger";
    case "budgetExceeded":
      return "border-warning/30 bg-warning/10 text-warning";
    case "cancelled":
      return "border-border-soft bg-surface-2 text-foreground-secondary";
    default:
      return "border-blue-bright/30 bg-blue-bright/10 text-blue-bright";
  }
}

export function stopNoticeCardClass(reason: string): string {
  switch (reason) {
    case "outOfCredits":
    case "fatalError":
      return "border-danger/40 bg-danger/10 text-danger";
    case "budgetExceeded":
      return "border-warning/40 bg-warning/10 text-warning";
    case "cancelled":
      return "border-border bg-surface-2 text-foreground-secondary";
    default:
      return "border-blue-bright/40 bg-blue-bright/10 text-blue-bright";
  }
}

export function stopNoticeShortLabel(notice: StopNotice, userCredits: number): string {
  switch (notice.reason) {
    case "outOfCredits":
      return `Paused: Out of Balance ($${creditsToUsd(userCredits).toFixed(2)} remaining)`;
    case "budgetExceeded":
      return "Paused: Run spending limit reached";
    case "cancelled":
      return "Stopped by user";
    case "maxIterations":
      return `Paused: Step limit reached (${AGENT_LOOP_LIMITS.maxIterations} steps)`;
    case "timeout":
      return "Paused: Execution timed out";
    default:
      return isVerificationFailure(notice) ? "Stopped: Checks failed" : "Stopped: Unexpected error";
  }
}

export function stopNoticeTitle(notice: StopNotice): string {
  switch (notice.reason) {
    case "outOfCredits":
      return "Run Paused: Out of Balance";
    case "budgetExceeded":
      return "Run Paused: Spending Limit Reached";
    case "cancelled":
      return "Run Cancelled: Stopped by User";
    case "maxIterations":
      return `Run Paused: Step Limit Reached (${AGENT_LOOP_LIMITS.maxIterations} iterations)`;
    case "timeout":
      return "Run Paused: Execution Timed Out";
    default:
      return isVerificationFailure(notice) ? "Run Stopped: Checks Failed" : "Run Stopped: Unexpected Error";
  }
}

export function stopNoticeDescription(notice: StopNotice, userCredits: number): string {
  switch (notice.reason) {
    case "outOfCredits":
      return userCredits <= 0
        ? "You have used your $10.00 free credit balance. Top up your balance in dollars or upgrade to Pro to continue building."
        : `You have $${creditsToUsd(userCredits).toFixed(2)} balance available. Click Continue Building to proceed.`;
    case "budgetExceeded":
      return "The AI stopped because the token budget limit was reached. Click below to continue building.";
    case "cancelled":
      return "Execution was stopped. Click below to resume where the AI left off.";
    default:
      return isVerificationFailure(notice)
        ? notice.detail.replace(LEADING_SYMBOLS, "").trim()
        : "The run was interrupted by an unexpected error. Click below to retry.";
  }
}
