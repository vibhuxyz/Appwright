export interface StopNotice {
  stopReason: string;
  detail: string;
  content: string;
}

export function resolveStopNotice(
  stopReason: string,
  isOutOfCredits?: boolean,
): StopNotice {
  switch (stopReason) {
    case "blocked":
      return {
        stopReason: "blocked",
        detail: "Blocked: looks like a destructive database operation",
        content:
          "🚫 This looks like a destructive database operation, so it was blocked before running. Rephrase it if that wasn't the intent, or make the change directly yourself if you're sure.",
      };
    case "cancelled":
      return {
        stopReason: "cancelled",
        detail: "Stopped by user",
        content: "⏹ Run stopped by user.",
      };
    case "budgetExceeded":
      if (isOutOfCredits) {
        return {
          stopReason: "outOfCredits",
          detail: "Out of credits: available token balance exhausted",
          content:
            "⚠️ Run paused: Out of credits. You have used all your available credits. Click 'Add Credits' to top up your balance and resume building.",
        };
      }
      return {
        stopReason: "budgetExceeded",
        detail: "Out of tokens / budget ceiling reached",
        content:
          "⚠️ Run paused: Out of tokens or budget ceiling reached. Click 'Continue Building' to proceed.",
      };
    case "outOfCredits":
      return {
        stopReason: "outOfCredits",
        detail: "Out of credits: available token balance exhausted",
        content:
          "⚠️ Run paused: Out of credits. You have used all your available credits. Click 'Add Credits' to top up your balance and resume building.",
      };
    case "maxIterations":
      return {
        stopReason: "maxIterations",
        detail: "Maximum iterations reached",
        content:
          "⚠️ Run paused: Maximum turn limit reached (60 steps). Click 'Continue Building' to work on remaining tasks.",
      };
    case "timeout":
      return {
        stopReason: "timeout",
        detail: "Execution timed out",
        content:
          "⏱️ Run paused: The execution timed out after 10 minutes. Click 'Continue Building' to resume.",
      };
    case "fatalError":
    default:
      return {
        stopReason: "fatalError",
        detail: "Model provider error",
        content:
          "❌ Run stopped due to an error from the model provider. Click 'Retry' to continue.",
      };
  }
}
