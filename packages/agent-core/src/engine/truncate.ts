// Truncation — every tool result passes through this before it enters
// message history. A 4MB file blows the context window and the budget.

const DEFAULT_MAX_CHARS = 8_000;

export function truncate(
  content: string,
  maxChars = DEFAULT_MAX_CHARS,
): string {
  if (content.length <= maxChars) return content;

  const half = Math.floor(maxChars / 2);
  const head = content.slice(0, half);
  const tail = content.slice(content.length - half);
  const omitted = content.length - head.length - tail.length;

  return `${head}\n... ${omitted} characters omitted ...\n${tail}`;
}
