export const MAX_SNAPSHOT_LINES = 200;
export const MAX_SNAPSHOT_BYTES = 8_000;

export function truncateSnapshot(
  snapshot: string,
  limits: { readonly maxLines: number; readonly maxBytes: number } = {
    maxLines: MAX_SNAPSHOT_LINES,
    maxBytes: MAX_SNAPSHOT_BYTES,
  },
): string {
  const lines = snapshot.split(/\r?\n/);
  const kept: string[] = [];
  let usedBytes = 0;
  for (const line of lines) {
    const lineBytes = Buffer.byteLength(line, "utf8") + 1;
    if (kept.length >= limits.maxLines || usedBytes + lineBytes > limits.maxBytes) break;
    kept.push(line);
    usedBytes += lineBytes;
  }
  const hidden = lines.length - kept.length;
  return hidden > 0 ? `${kept.join("\n")}\n(+${hidden} more lines)` : kept.join("\n");
}
