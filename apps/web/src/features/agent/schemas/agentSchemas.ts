import { z } from "zod";

export const sessionStatusSchema = z.enum(["IDLE", "RUNNING", "ERROR"]);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;

export const sessionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string().nullable(),
  model: z.string(),
  cost: z.number(),
  tokenIn: z.number(),
  tokenOut: z.number(),
  status: sessionStatusSchema,
  createdAt: z.string(),
});
export type Session = z.infer<typeof sessionSchema>;

export const msgSchema = z.object({
  id: z.string(),
  seq: z.number(),
  role: z.string(),
  type: z.enum(["text", "toolCall", "toolResponse"]),
  content: z.string(),
  data: z
    .object({
      toolCallId: z.string().optional(),
      toolName: z.string().optional(),
      args: z.record(z.string(), z.unknown()).optional(),
      stopReason: z.string().optional(),
    })
    .nullable(),
  createdAt: z.string(),
});
export type Msg = z.infer<typeof msgSchema>;

export interface StopNotice {
  reason: string;
  detail: string;
}
