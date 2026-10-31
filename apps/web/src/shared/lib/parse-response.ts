const EMPTY_JSON_STATUSES = new Set([204, 205]);

export function parseResponseJson<T>(status: number, text: string): T {
  if (EMPTY_JSON_STATUSES.has(status)) {
    return undefined as T;
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return undefined as T;
  }
  return JSON.parse(trimmed) as T;
}
