import type { Response } from "express";
import {
  publishChannel,
  sessionChannel,
  subscribeChannel,
  type SseApprovalFrame,
  type SseDeltaFrame,
  type SseFrame,
  type SseMessageFrame,
  type SseStatusFrame,
  type SseUsageFrame,
  type SseVerificationFrame,
  type Subscription,
} from "@repo/cache";

export type {
  SseApprovalFrame,
  SseDeltaFrame,
  SseFrame,
  SseMessageFrame,
  SseStatusFrame,
  SseUsageFrame,
  SseVerificationFrame,
} from "@repo/cache";

const MAX_BUFFER = 200;
const buffers = new Map<string, SseMessageFrame[]>();
const listeners = new Map<string, Set<Response>>();
const subscriptions = new Map<string, Subscription>();

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

function broadcastLocal(sessionId: string, frame: SseFrame): void {
  const set = listeners.get(sessionId);
  if (!set) return;
  for (const res of [...set]) write(res, sessionId, frame);
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

  if (!subscriptions.has(sessionId)) {
    subscribeChannel<SseFrame>(sessionChannel(sessionId), (frame) => {
      broadcastLocal(sessionId, frame);
    })
      .then((sub) => {
        subscriptions.set(sessionId, sub);
      })
      .catch(() => {});
  }

  res.on("close", () => {
    set?.delete(res);
    if (set?.size === 0) {
      listeners.delete(sessionId);
      const sub = subscriptions.get(sessionId);
      if (sub) {
        sub.unsubscribe().catch(() => {});
        subscriptions.delete(sessionId);
      }
    }
  });
}

export function publishDelta(sessionId: string, delta: string): void {
  const frame: SseDeltaFrame = { kind: "delta", delta };
  broadcastLocal(sessionId, frame);
  publishChannel(sessionChannel(sessionId), frame).catch(() => {});
}

export function publishUsage(sessionId: string, frame: SseUsageFrame): void {
  broadcastLocal(sessionId, frame);
  publishChannel(sessionChannel(sessionId), frame).catch(() => {});
}

export function publishStatus(
  sessionId: string,
  status: "IDLE" | "RUNNING" | "AWAITING_APPROVAL" | "ERROR",
  detail?: string,
  reason?: string,
): void {
  const frame: SseStatusFrame = { kind: "status", status, detail, reason };
  broadcastLocal(sessionId, frame);
  publishChannel(sessionChannel(sessionId), frame).catch(() => {});
}

export function publishApproval(
  sessionId: string,
  approval: SseApprovalFrame["approval"],
): void {
  const frame: SseApprovalFrame = { kind: "approval", approval };
  broadcastLocal(sessionId, frame);
  publishChannel(sessionChannel(sessionId), frame).catch(() => {});
}

export function publishVerification(
  sessionId: string,
  results: unknown,
): void {
  const frame: SseVerificationFrame = { kind: "verification", results };
  broadcastLocal(sessionId, frame);
  publishChannel(sessionChannel(sessionId), frame).catch(() => {});
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

  broadcastLocal(sessionId, frame);
  publishChannel(sessionChannel(sessionId), frame).catch(() => {});
}

