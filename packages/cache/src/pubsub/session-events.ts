// The wire contract for session:<id> — both the in-process API (V0-V2 path)
// and the sandboxed worker (V3 path) publish these same shapes, so a
// browser subscribed via SSE can't tell which one produced a frame.

export function sessionChannel(sessionId: string): string {
  return `session:${sessionId}`;
}

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

export interface SseUsageFrame {
  kind: "usage";
  cost: number;
  tokenIn: number;
  tokenOut: number;
  creditsRemaining?: number;
}

export interface SseStatusFrame {
  kind: "status";
  status: "IDLE" | "RUNNING" | "AWAITING_APPROVAL" | "ERROR";
  detail?: string;
  reason?: string;
}

export interface SseApprovalFrame {
  kind: "approval";
  approval: {
    id: string;
    sessionId: string;
    toolCallId: string | null;
    toolName: string;
    args: unknown;
    status: string;
    createdAt: string;
  };
}

export interface SseVerificationFrame {
  kind: "verification";
  results: unknown;
}

export interface SseAssetRequestFrame {
  kind: "assetRequest";
  assetRequest: {
    id: string;
    sessionId: string;
    blueprintId: string;
    slots: unknown;
    status: string;
    createdAt: string;
  };
}

export type SseFrame =
  | SseMessageFrame
  | SseDeltaFrame
  | SseUsageFrame
  | SseStatusFrame
  | SseApprovalFrame
  | SseVerificationFrame
  | SseAssetRequestFrame;
