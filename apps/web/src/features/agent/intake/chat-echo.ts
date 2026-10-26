const MAX_PROFILE_TITLE_CHARS = 42;

interface TranscriptMessage {
  seq?: number;
  role?: string;
  content: string;
  data?: { questionReply?: { kind: string } } | null;
}

export function profileTitleFromPrompt(prompt: string): string {
  const named = prompt.match(
    /(?:my\s+)?business(?:'s)?\s+name\s*(?:is|:)\s+(.+?)(?:\s+where\b|[.!?,;]|$)/i,
  );
  const businessName = named?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  if (businessName.length >= 2 && businessName.length <= MAX_PROFILE_TITLE_CHARS) {
    return businessName;
  }
  const sentence = prompt.replace(/\s+/g, " ").trim().split(/[.!?]/)[0]?.trim() ?? "";
  const title = sentence.length > 0 ? sentence : "Your app";
  if (title.length <= MAX_PROFILE_TITLE_CHARS) return title;
  return `${title.slice(0, MAX_PROFILE_TITLE_CHARS - 1)}…`;
}

function isAfter(message: TranscriptMessage, afterSeq: number): boolean {
  return (message.seq ?? -1) > afterSeq;
}

export function promptIsInChat(
  messages: readonly TranscriptMessage[],
  prompt: string,
  afterSeq: number,
): boolean {
  return messages.some(
    (message) => isAfter(message, afterSeq) && message.role === "user" && message.content === prompt,
  );
}

export function questionsAreInChat(
  messages: readonly TranscriptMessage[],
  questions: readonly { text: string }[],
  afterSeq: number,
): boolean {
  if (questions.length === 0) return false;
  return messages.some((message) => isAfter(message, afterSeq) && message.data?.questionReply?.kind === "intake");
}

export function intakeLanded(
  messages: readonly TranscriptMessage[],
  turn: { prompt: string; questions: readonly { text: string }[]; afterSeq: number },
): boolean {
  if (!promptIsInChat(messages, turn.prompt, turn.afterSeq)) return false;
  if (turn.questions.length === 0) return true;
  return questionsAreInChat(messages, turn.questions, turn.afterSeq);
}
