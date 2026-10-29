const PURE_CHAT =
  /^(?:thanks|thank you|ty|ok|okay|k|looks good|lgtm|great|nice|perfect|cool|got it|sounds good|awesome|good job|well done|nice work)[.!?\s]*$/i;

const MAX_CHAT_CHARS = 40;
const SNIPPET_LINE_LIMIT = 12;

export function isPureChat(content: string): boolean {
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.length > 0 && flat.length <= MAX_CHAT_CHARS && PURE_CHAT.test(flat);
}

export function isVerificationTranscript(data: unknown, content: string): boolean {
  if (typeof data === "object" && data !== null && "verificationRetry" in data) return true;
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.startsWith("Verification failed") || flat.startsWith("Running verification checks");
}

export function looksLikeSnippet(content: string): boolean {
  return content.includes("```") || content.split(/\r?\n/).length > SNIPPET_LINE_LIMIT;
}
