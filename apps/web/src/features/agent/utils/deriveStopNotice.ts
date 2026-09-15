import type { Msg, StopNotice } from "../schemas/agentSchemas";

type ContentMatcher = (content: string) => StopNotice | null;

const CONTENT_MATCHERS: ContentMatcher[] = [
  (content) =>
    content.toLowerCase().includes("out of credit")
      ? { reason: "outOfCredits", detail: content }
      : null,
  (content) => {
    const isBudgetNotice =
      content.startsWith("⚠️ Run paused:") ||
      content.includes("budget limit") ||
      content.includes("safety limit");
    if (!isBudgetNotice) return null;
    const isToken =
      content.toLowerCase().includes("token") || content.toLowerCase().includes("budget");
    return { reason: isToken ? "budgetExceeded" : "maxIterations", detail: content };
  },
  (content) =>
    content.startsWith("⏹ Run stopped by user")
      ? { reason: "cancelled", detail: "Run stopped by user" }
      : null,
];

// The live SSE `stopNotice` covers a run that just ended in this tab. On a
// fresh page load there is no live event to replay, so the same notice is
// re-derived from the last persisted message's content/stopReason.
function deriveFromLastMessage(messages: Msg[]): StopNotice | null {
  const lastMsg = messages.at(-1);
  if (!lastMsg || lastMsg.role !== "assistant") return null;

  const reason = lastMsg.data?.stopReason;
  if (reason && reason !== "completed") {
    return { reason, detail: lastMsg.content };
  }
  if (reason === "outOfCredits") {
    return { reason: "outOfCredits", detail: lastMsg.content };
  }

  const content = lastMsg.content || "";
  for (const matcher of CONTENT_MATCHERS) {
    const match = matcher(content);
    if (match) return match;
  }
  return null;
}

export function deriveActiveStopNotice(
  liveStopNotice: StopNotice | null,
  messages: Msg[],
  userCredits: number,
): StopNotice | null {
  const raw = liveStopNotice ?? deriveFromLastMessage(messages);
  if (!raw) return null;

  const isOutOfCredits =
    raw.reason === "outOfCredits" || (raw.reason === "budgetExceeded" && userCredits <= 0);

  return { reason: isOutOfCredits ? "outOfCredits" : raw.reason, detail: raw.detail };
}
