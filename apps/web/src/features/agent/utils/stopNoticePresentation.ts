import type { StopNotice } from "../schemas/agentSchemas";

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
      return `Paused: Out of Credits (${userCredits.toLocaleString()} remaining)`;
    case "budgetExceeded":
      return "Paused: Out of tokens / budget ceiling";
    case "cancelled":
      return "Stopped by user";
    case "maxIterations":
      return "Paused: Step limit reached (60 steps)";
    case "timeout":
      return "Paused: Execution timed out";
    default:
      return "Stopped: Model error";
  }
}

export function stopNoticeTitle(notice: StopNotice): string {
  switch (notice.reason) {
    case "outOfCredits":
      return "Run Paused: Out of Credits";
    case "budgetExceeded":
      return "Run Paused: Out of Tokens / Budget Ceiling Reached";
    case "cancelled":
      return "Run Cancelled: Stopped by User";
    case "maxIterations":
      return "Run Paused: Step Limit Reached (60 iterations)";
    case "timeout":
      return "Run Paused: Execution Timed Out";
    default:
      return "Run Stopped: Model Provider Error";
  }
}

export function stopNoticeDescription(notice: StopNotice, userCredits: number): string {
  switch (notice.reason) {
    case "outOfCredits":
      return userCredits <= 0
        ? "You have used all available credits (~3 apps). Add credits to keep building your project."
        : `You have ${userCredits.toLocaleString()} credits available. Click Continue Building to proceed.`;
    case "budgetExceeded":
      return "The AI stopped because the token budget limit was reached. Click below to continue building.";
    case "cancelled":
      return "Execution was stopped. Click below to resume where the AI left off.";
    default:
      return "Click below to continue building the remaining tasks in the checklist.";
  }
}
