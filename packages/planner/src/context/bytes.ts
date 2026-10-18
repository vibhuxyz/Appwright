const CONTINUATION_BYTE_MASK = 0b1100_0000;
const CONTINUATION_BYTE_TAG = 0b1000_0000;

export function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

export function truncateUtf8(text: string, maxBytes: number): string {
  if (maxBytes <= 0) return "";
  const buffer = Buffer.from(text, "utf8");
  if (buffer.length <= maxBytes) return text;
  let end = maxBytes;
  while (end > 0 && ((buffer[end] ?? 0) & CONTINUATION_BYTE_MASK) === CONTINUATION_BYTE_TAG) {
    end -= 1;
  }
  return buffer.subarray(0, end).toString("utf8");
}
