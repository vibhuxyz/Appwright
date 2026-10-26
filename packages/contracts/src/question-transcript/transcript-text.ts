const ELLIPSIS = "…";

export function flattenTranscriptText(text: string, maxChars: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= maxChars) return flat;
  return `${flat.slice(0, Math.max(0, maxChars - ELLIPSIS.length)).trimEnd()}${ELLIPSIS}`;
}

export function fitToBytes(text: string, maxBytes: number): string {
  const bytes = new TextEncoder().encode(text);
  if (bytes.length <= maxBytes) return text;
  const ellipsisBytes = new TextEncoder().encode(ELLIPSIS).length;
  const cut = new TextDecoder().decode(bytes.slice(0, Math.max(0, maxBytes - ellipsisBytes)));
  return `${cut.replace(/�+$/, "")}${ELLIPSIS}`;
}
