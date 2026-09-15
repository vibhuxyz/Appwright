import type { Response } from "express";

// Three frame kinds go over the wire:
//   "delta"   ephemeral text streaming, never buffered — a refresh loses the
//             mid-word animation, which is fine, the final text is a message.
//   "message" a persisted DB row (Project's Message). Buffered per session so
//             a reconnect within a few seconds (Slice 4) replays without a
//             DB round-trip, ordered by Message.seq.
//   "status"  session state notifications (e.g. RUNNING, IDLE, ERROR) with details and reason.
export interface SseMessageFrame {
  kind: "message";
  seq: number;
  message: {
    id: string;
    seq: number;
    role: string;
    type: string;
    content: string;
    data: unknown;
    createdAt: string;
  };
}

export interface SseDeltaFrame {
  kind: "delta";
  delta: string;
}

// Running session totals, pushed after each model turn. Not buffered and
// not persisted as a Message: the numbers already live on the Session row,
// so a reconnect re-reads them from there rather than replaying a history
// of increments that would double-count.
export interface SseUsageFrame {
  kind: "usage";
  cost: number;
  tokenIn: number;
  tokenOut: number;
  creditsRemaining?: number;
}

export interface SseStatusFrame {
  kind: "status";
  status: "IDLE" | "RUNNING" | "ERROR";
  detail?: string;
  reason?: string;
}

export type SseFrame =
  | SseMessageFrame
  | SseDeltaFrame
  | SseUsageFrame
  | SseStatusFrame;

const MAX_BUFFER = 200;
const buffers = new Map<string, SseMessageFrame[]>();
const listeners = new Map<string, Set<Response>>();

// A dead listener must never take the run down with it — the run is a
// background job that happens to have a listener, not a request that
// happens to be slow (V1 trap table). If a write to one client's socket
// fails (they closed the tab, we re-navigated, whatever), drop that
// listener and keep publishing to everyone else; never let it bubble up
// into the agent loop's emit() as a fatalError.
function write(res: Response, sessionId: string, frame: SseFrame): void {
  try {
    const id = frame.kind === "message" ? frame.seq : undefined;
    res.write(
      `${id !== undefined ? `id: ${id}\n` : ""}event: ${frame.kind}\ndata: ${JSON.stringify(frame)}\n\n`,
    );
  } catch {
    listeners.get(sessionId)?.delete(res);
  }
}

export function attachSseClient(
  sessionId: string,
  res: Response,
  afterSeq: number,
): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(":ok\n\n");

  const buffered = buffers.get(sessionId) ?? [];
  for (const frame of buffered) {
    if (frame.seq > afterSeq) write(res, sessionId, frame);
  }

  let set = listeners.get(sessionId);
  if (!set) {
    set = new Set();
    listeners.set(sessionId, set);
  }
  set.add(res);

  res.on("close", () => set?.delete(res));
}

export function publishDelta(sessionId: string, delta: string): void {
  const set = listeners.get(sessionId);
  if (!set) return;
  const frame: SseDeltaFrame = { kind: "delta", delta };
  for (const res of [...set]) write(res, sessionId, frame);
}

export function publishUsage(sessionId: string, frame: SseUsageFrame): void {
  const set = listeners.get(sessionId);
  if (!set) return;
  for (const res of [...set]) write(res, sessionId, frame);
}

export function publishStatus(
  sessionId: string,
  status: "IDLE" | "RUNNING" | "ERROR",
  detail?: string,
  reason?: string,
): void {
  const set = listeners.get(sessionId);
  if (!set) return;
  const frame: SseStatusFrame = { kind: "status", status, detail, reason };
  for (const res of [...set]) write(res, sessionId, frame);
}

export function publishMessage(
  sessionId: string,
  frame: SseMessageFrame,
): void {
  let buf = buffers.get(sessionId);
  if (!buf) {
    buf = [];
    buffers.set(sessionId, buf);
  }
  buf.push(frame);
  if (buf.length > MAX_BUFFER) buf.shift();

  const set = listeners.get(sessionId);
  if (!set) return;
  for (const res of [...set]) write(res, sessionId, frame);
}
