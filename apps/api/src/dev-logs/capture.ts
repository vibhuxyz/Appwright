import type { DevLogLine } from "@repo/contracts";
import { createLogBuffer, type LogBuffer } from "./log-buffer";
import { splitLines, stripAnsi } from "./split-lines";

const buffers = new Map<string, LogBuffer>();

export function logBufferFor(serverKey: string): LogBuffer {
  const existing = buffers.get(serverKey);
  if (existing) return existing;
  const created = createLogBuffer();
  buffers.set(serverKey, created);
  return created;
}

export function logSystem(serverKey: string, text: string): void {
  logBufferFor(serverKey).append("system", text, new Date().toISOString());
}

async function pump(
  source: ReadableStream<Uint8Array>,
  stream: DevLogLine["stream"],
  serverKey: string,
  mirror: NodeJS.WriteStream,
): Promise<void> {
  const decoder = new TextDecoder();
  let pending = "";
  for await (const chunk of source) {
    const text = decoder.decode(chunk, { stream: true });
    mirror.write(text);
    const split = splitLines(pending, text);
    pending = split.pending;
    for (const line of split.lines) logBufferFor(serverKey).append(stream, line, new Date().toISOString());
  }
  const tail = stripAnsi(pending).trim();
  if (tail) logBufferFor(serverKey).append(stream, tail, new Date().toISOString());
}

interface CapturedProcess {
  stdout: ReadableStream<Uint8Array>;
  stderr: ReadableStream<Uint8Array>;
  exited: Promise<number>;
}

function pumpBoth(serverKey: string, proc: CapturedProcess): void {
  void Promise.all([
    pump(proc.stdout, "stdout", serverKey, process.stdout),
    pump(proc.stderr, "stderr", serverKey, process.stderr),
  ]).catch((error: unknown) => logSystem(serverKey, `Log capture stopped: ${String(error)}`));
}

export function captureInstallLogs(serverKey: string, proc: CapturedProcess): void {
  pumpBoth(serverKey, proc);
  void proc.exited.then((code) => logSystem(serverKey, `Install finished with code ${code}`));
}

export function captureServerLogs(serverKey: string, proc: CapturedProcess): void {
  const buffer = logBufferFor(serverKey);
  buffer.setRunning(true);
  pumpBoth(serverKey, proc);
  void proc.exited.then((code) => {
    buffer.setRunning(false);
    logSystem(serverKey, `Dev server exited with code ${code}`);
  });
}
