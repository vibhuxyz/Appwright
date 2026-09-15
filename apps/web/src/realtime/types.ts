import { z } from "zod";
import { msgSchema } from "@/features/agent/schemas/agentSchemas";

// The backend streams over SSE (EventSource), not a raw WebSocket — the
// stack calls for "native WebSocket", but changing the wire protocol is a
// backend change outside this reorg's scope. This layer plays the same
// role (connect → validate → route → store) regardless of transport.
export const messageFrameSchema = z.object({ message: msgSchema });
export const statusFrameSchema = z.object({
  status: z.enum(["RUNNING", "IDLE", "ERROR"]),
  detail: z.string().optional(),
  reason: z.string().optional(),
});
export const deltaFrameSchema = z.object({ delta: z.string() });
export const usageFrameSchema = z.object({
  cost: z.number(),
  tokenIn: z.number(),
  tokenOut: z.number(),
  creditsRemaining: z.number().optional(),
});

export type MessageFrame = z.infer<typeof messageFrameSchema>;
export type StatusFrame = z.infer<typeof statusFrameSchema>;
export type DeltaFrame = z.infer<typeof deltaFrameSchema>;
export type UsageFrame = z.infer<typeof usageFrameSchema>;

export interface ConversationStreamHandlers {
  onMessage: (frame: MessageFrame) => void;
  onStatus: (frame: StatusFrame) => void;
  onDelta: (frame: DeltaFrame) => void;
  onUsage: (frame: UsageFrame) => void;
}
