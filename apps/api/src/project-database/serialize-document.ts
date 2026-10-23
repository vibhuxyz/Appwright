export function serializeValue(v: unknown): unknown {
  if (!v || typeof v !== "object") return v;
  if ("toHexString" in v && typeof (v as { toHexString: () => string }).toHexString === "function") {
    return (v as { toHexString: () => string }).toHexString();
  }
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map(serializeValue);
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(v)) {
    out[key] = serializeValue(val);
  }
  return out;
}

export function serializeDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(doc)) {
    result[key] = serializeValue(val);
  }
  return result;
}
