export const MAX_TOOL_RESULT_BYTES = 12_288;
const MAX_SHRINK_ATTEMPTS = 8;
const UTF8_CONTINUATION_MASK = 0b1100_0000;
const UTF8_CONTINUATION_BITS = 0b1000_0000;

function isContinuationByte(buffer: Buffer, index: number): boolean {
  const byte = buffer[index];
  return byte !== undefined && (byte & UTF8_CONTINUATION_MASK) === UTF8_CONTINUATION_BITS;
}

function takePrefixBytes(text: string, maxBytes: number): string {
  const buffer = Buffer.from(text, "utf8");
  if (maxBytes <= 0 || buffer.length === 0) return "";
  let end = Math.min(maxBytes, buffer.length);
  while (end > 0 && isContinuationByte(buffer, end)) end -= 1;
  return buffer.subarray(0, end).toString("utf8");
}

function takeSuffixBytes(text: string, maxBytes: number): string {
  const buffer = Buffer.from(text, "utf8");
  if (maxBytes <= 0 || buffer.length === 0) return "";
  let start = Math.max(0, buffer.length - maxBytes);
  while (start < buffer.length && isContinuationByte(buffer, start)) start += 1;
  return buffer.subarray(start).toString("utf8");
}

export function truncate(content: string, maxBytes = MAX_TOOL_RESULT_BYTES): string {
  const size = Buffer.byteLength(content, "utf8");
  if (size <= maxBytes) return content;
  let headBytes = Math.floor(maxBytes / 2);
  let tailBytes = Math.floor(maxBytes / 2);
  for (let attempt = 0; attempt < MAX_SHRINK_ATTEMPTS; attempt += 1) {
    const head = takePrefixBytes(content, headBytes);
    const tail = takeSuffixBytes(content, tailBytes);
    const omitted = size - Buffer.byteLength(head, "utf8") - Buffer.byteLength(tail, "utf8");
    const note = `\n[truncated: omitted ${omitted} bytes]\n`;
    if (Buffer.byteLength(head + note + tail, "utf8") <= maxBytes) return `${head}${note}${tail}`;
    const overflow = Buffer.byteLength(head + note + tail, "utf8") - maxBytes;
    headBytes = Math.max(0, headBytes - Math.ceil(overflow / 2) - 1);
    tailBytes = Math.max(0, tailBytes - Math.ceil(overflow / 2) - 1);
  }
  return takePrefixBytes(`[truncated: omitted ${size} bytes]`, maxBytes);
}
