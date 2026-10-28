const MAX_CONVERSATIONAL_WORDS = 8;

const CONVERSATIONAL_WORDS: ReadonlySet<string> = new Set([
  "h", "hi", "hy", "hii", "hiii", "hey", "heyy", "hello", "helo", "hallo", "yo", "sup", "hola", "namaste",
  "good", "morning", "afternoon", "evening", "night", "there", "bro", "buddy", "friend", "team",
  "how", "are", "you", "u", "r", "doing", "going", "whats", "what", "s", "up", "is", "new",
  "i", "am", "m", "fine", "well", "great", "ok", "okay", "cool", "nice", "thanks", "thank", "thx", "bye",
  "who", "can", "do", "test", "testing", "please", "again", "so", "much", "very",
]);

const BUILD_REQUEST_PATTERN =
  /\b(?:build|create|make|design|develop|generate|add|app|apps|application|website|web|site|page|landing|dashboard|store|shop|portfolio|blog|platform|tool|clone)\b/;

function words(prompt: string): string[] {
  return prompt
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

export function isConversationalMessage(prompt: string): boolean {
  const promptWords = words(prompt);
  if (promptWords.length === 0) return true;
  if (promptWords.length > MAX_CONVERSATIONAL_WORDS) return false;
  return promptWords.every((word) => CONVERSATIONAL_WORDS.has(word));
}

export function looksLikeBuildRequest(prompt: string): boolean {
  return BUILD_REQUEST_PATTERN.test(prompt.toLowerCase());
}
