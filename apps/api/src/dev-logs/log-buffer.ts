import { DEV_LOG_LIMITS, type DevLogLine } from "@repo/contracts";

export interface LogBuffer {
  append(stream: DevLogLine["stream"], text: string, at: string): void;
  since(afterSeq: number): { lines: DevLogLine[]; nextSeq: number };
  setRunning(isRunning: boolean): void;
  isRunning(): boolean;
}

export function createLogBuffer(maxLines: number = DEV_LOG_LIMITS.maxLines): LogBuffer {
  const lines: DevLogLine[] = [];
  let nextSeq = 0;
  let running = false;
  return {
    append(stream, text, at) {
      lines.push({ seq: nextSeq, stream, text: text.slice(0, DEV_LOG_LIMITS.maxLineChars), at });
      nextSeq += 1;
      if (lines.length > maxLines) lines.splice(0, lines.length - maxLines);
    },
    since(afterSeq) {
      const fresh = lines.filter((line) => line.seq >= afterSeq).slice(0, DEV_LOG_LIMITS.pageLines);
      const last = fresh.at(-1);
      return { lines: fresh, nextSeq: last ? last.seq + 1 : Math.max(afterSeq, nextSeq) };
    },
    setRunning(isRunning) {
      running = isRunning;
    },
    isRunning: () => running,
  };
}
