import z from "zod";

export const SessionStatus = z.enum(["IDLE", "RUNNING", "ERROR"]);

export const CreateSessionRequest = z.object({
  title: z.string().optional(),
});

export const UpdateSessionRequest = z.object({
  model: z.string().min(1),
});

export const SessionResponse = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string().nullable(),
  model: z.string(),
  cost: z.number(),
  tokenIn: z.number(),
  tokenOut: z.number(),
  status: SessionStatus,
  createdAt: z.string(),
});

export const SendMessageRequest = z.object({
  sessionId: z.string(),
  prompt: z.string().min(1),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequest>;
export type UpdateSessionRequest = z.infer<typeof UpdateSessionRequest>;
export type SessionResponse = z.infer<typeof SessionResponse>;
export type SendMessageRequest = z.infer<typeof SendMessageRequest>;
