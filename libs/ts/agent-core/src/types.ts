import { z } from "zod";

// ---------------------------------------------------------------------------
// Message — provider-agnostic history. Three branches, discriminated on `type`.
// `role` (user/assistant) lives *inside* the text branch — it is not the
// discriminant, `type` is, and Zod requires the discriminant literal to be
// unique per branch.
// ---------------------------------------------------------------------------

const textMessage = z.object({
  role: z.enum(["user", "assistant"]),
  type: z.literal("text"),
  content: z.string(),
});

const toolCallMessage = z.object({
  role: z.literal("assistant"),
  type: z.literal("toolCall"),
  toolCallId: z.string(),
  content: z.object({
    toolName: z.string(),
    args: z.record(z.string(), z.unknown()),
    // Opaque, provider-owned, replayed verbatim on the next request. It is
    // part of the Message (not transient loop state) because it has to
    // survive being written to Postgres and read back on resume.
    providerMeta: z.unknown().optional(),
  }),
});

const toolResponseMessage = z.object({
  role: z.literal("tool"),
  type: z.literal("toolResponse"),
  toolCallId: z.string(),
  content: z.string(), // wrapUntrusted() output — what the LLM sees (D23)
  data: z.unknown().optional(), // structured result for code, not the model
});

export const MessageSchema = z.discriminatedUnion("type", [
  textMessage,
  toolCallMessage,
  toolResponseMessage,
]);

export type Message = z.infer<typeof MessageSchema>;

// ---------------------------------------------------------------------------
// AgentEvent — 7 types, not 20. Every event carries seq + sessionId.
// Add a type only in the version that first emits it (D26/D27/D28 context).
// ---------------------------------------------------------------------------

const baseEvent = {
  seq: z.number().int().nonnegative(),
  sessionId: z.string(),
};

const agentStartEvent = z.object({
  ...baseEvent,
  type: z.literal("agent_start"),
});

const textDeltaEvent = z.object({
  ...baseEvent,
  type: z.literal("text_delta"),
  delta: z.string(),
});

const toolCallStartEvent = z.object({
  ...baseEvent,
  type: z.literal("tool_call_start"),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.record(z.string(), z.unknown()),
  // Rides on the event because the event is what gets persisted, and the
  // next request rebuilds messages[] from Postgres. Held only in memory it
  // survives one turn and then vanishes — which is worse than never having
  // it, because the failure only appears on the second message in a session.
  providerMeta: z.unknown().optional(),
});

const toolCallEndEvent = z.object({
  ...baseEvent,
  type: z.literal("tool_call_end"),
  toolCallId: z.string(),
  result: z.string(),
});

const toolErrorEvent = z.object({
  ...baseEvent,
  type: z.literal("tool_error"),
  toolCallId: z.string(),
  error: z.string(),
});

export const StopReasonSchema = z.enum([
  "completed",
  "cancelled",
  "timeout",
  "maxIterations",
  "budgetExceeded",
  "fatalError",
]);

export type StopReason = z.infer<typeof StopReasonSchema>;

// Emitted once per model turn, only when the provider actually reported
// counts. It is the durable half of budget enforcement: the loop uses it to
// decide whether to keep going, and V1's API uses it to roll real numbers
// onto Session.cost/tokenIn/tokenOut.
const usageEvent = z.object({
  ...baseEvent,
  type: z.literal("usage"),
  model: z.string(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative(),
});

const agentEndEvent = z.object({
  ...baseEvent,
  type: z.literal("agent_end"),
  stopReason: StopReasonSchema,
});

const errorEvent = z.object({
  ...baseEvent,
  type: z.literal("error"),
  message: z.string(),
});

export const AgentEventSchema = z.discriminatedUnion("type", [
  agentStartEvent,
  textDeltaEvent,
  toolCallStartEvent,
  toolCallEndEvent,
  toolErrorEvent,
  usageEvent,
  agentEndEvent,
  errorEvent,
]);

export type AgentEvent = z.infer<typeof AgentEventSchema>;

// ---------------------------------------------------------------------------
// Budget — bounds the loop, not the sandbox. Sandbox caps are a different
// limit (wall-clock cap on the box itself, D17 failure mode #4).
// ---------------------------------------------------------------------------

export const BudgetSchema = z.object({
  maxIterations: z.number().int().positive(),
  maxTokens: z.number().int().positive(),
  maxCostUsd: z.number().positive(),
  deadline: z.number().int(), // epoch ms
});

export type Budget = z.infer<typeof BudgetSchema>;

// ---------------------------------------------------------------------------
// AgentEventSink — a type alias, not a class (D26 context: the loop takes an
// emit callback and does not know where its output goes).
// ---------------------------------------------------------------------------

export type AgentEventSink = (event: AgentEvent) => void | Promise<void>;
