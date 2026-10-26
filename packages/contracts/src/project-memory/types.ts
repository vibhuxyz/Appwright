import type { SessionTurnRange } from "../revert-marker";

interface SessionRow {
  readonly sessionId: string;
  readonly seq: number;
}

export interface ProjectMemoryRows {
  readonly userRows: readonly (SessionRow & { content: string; data: unknown; createdAt: Date })[];
  readonly toolCallRows: readonly (SessionRow & { type: string; data: unknown })[];
  readonly blueprint?: {
    readonly intent: unknown;
    readonly pages: unknown;
    readonly features: unknown;
    readonly requirements: unknown;
    readonly isApproved: boolean;
    readonly tasks: readonly { title: string; status: string; owns: unknown }[];
  };
  readonly questions: readonly { status: string; questions: unknown }[];
  readonly pendingIntegrations: readonly { provider: string; reason: string }[];
  readonly assistantRows: readonly (SessionRow & { data: unknown; createdAt: Date })[];
  readonly revertedTurns: readonly SessionTurnRange[];
}
