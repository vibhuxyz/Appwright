import { z } from "zod";
import { AssetRequestResponse } from "@repo/contracts";
import { msgSchema } from "@/features/agent/schemas/agentSchemas";

// The backend streams over SSE (EventSource), not a raw WebSocket — the
// stack calls for "native WebSocket", but changing the wire protocol is a
// backend change outside this reorg's scope. This layer plays the same
// role (connect → validate → route → store) regardless of transport.
export const messageFrameSchema = z.object({ message: msgSchema });
export const statusFrameSchema = z.object({
  status: z.enum(["RUNNING", "IDLE", "ERROR", "AWAITING_APPROVAL"]),
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
export const assetRequestFrameSchema = z.object({
  assetRequest: AssetRequestResponse,
});

export const integrationConfigFrameSchema = z.object({
  kind: z.literal("integration_configuration_required").optional(),
  request: z.object({
    id: z.string(),
    sessionId: z.string(),
    projectId: z.string(),
    provider: z.string(),
    required: z.boolean(),
    reason: z.string(),
    environment: z.string(),
    createdAt: z.string(),
  }),
});

export const agentQuestionFrameSchema = z.object({
  kind: z.literal("agent_question").optional(),
  question: z.object({
    id: z.string(),
    sessionId: z.string(),
    status: z.string(),
    createdAt: z.string(),
  }),
});

const MAX_INTAKE_PROGRESS_CHARS = 200;
const MAX_INTAKE_PROGRESS_ITEMS = 40;

export const intakeProgressFrameSchema = z.object({
  kind: z.literal("intake_progress").optional(),
  tool: z.enum(["request", "questions", "planner"]),
  detail: z.string().min(1).max(MAX_INTAKE_PROGRESS_CHARS),
  items: z.array(z.string().max(MAX_INTAKE_PROGRESS_CHARS)).max(MAX_INTAKE_PROGRESS_ITEMS).optional(),
});

export type MessageFrame = z.infer<typeof messageFrameSchema>;
export type StatusFrame = z.infer<typeof statusFrameSchema>;
export type DeltaFrame = z.infer<typeof deltaFrameSchema>;
export type UsageFrame = z.infer<typeof usageFrameSchema>;
export type AssetRequestFrame = z.infer<typeof assetRequestFrameSchema>;
export type IntegrationConfigFrame = z.infer<typeof integrationConfigFrameSchema>;
export type AgentQuestionFrame = z.infer<typeof agentQuestionFrameSchema>;
export type IntakeProgressFrame = z.infer<typeof intakeProgressFrameSchema>;

export interface ConversationStreamHandlers {
  onMessage: (frame: MessageFrame) => void;
  onStatus: (frame: StatusFrame) => void;
  onDelta: (frame: DeltaFrame) => void;
  onUsage: (frame: UsageFrame) => void;
  onAssetRequest?: (frame: AssetRequestFrame) => void;
  onIntegrationConfig?: (frame: IntegrationConfigFrame) => void;
  onAgentQuestion?: (frame: AgentQuestionFrame) => void;
  onIntakeProgress?: (frame: IntakeProgressFrame) => void;
}
