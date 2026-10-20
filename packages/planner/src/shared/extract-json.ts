export function extractJsonObject(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? raw;
  const match = candidate.match(/\{[\s\S]*\}/);
  if (!match?.[0]) return undefined;
  try {
    return JSON.parse(match[0]);
  } catch {
    return undefined;
  }
}
