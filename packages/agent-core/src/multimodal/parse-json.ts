export function extractJsonFromReply(text: string): unknown | undefined {
  const trimmed = text.trim();
  const fenceMatch = /```(?:json)?\s*\n?([\s\S]*?)\n?```/i.exec(trimmed);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace <= firstBrace) return undefined;

  const jsonSubstring = candidate.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonSubstring);
  } catch {
    return undefined;
  }
}
