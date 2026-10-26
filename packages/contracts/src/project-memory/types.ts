export interface ProjectMemoryRows {
  readonly userRows: readonly { content: string; data: unknown; createdAt: Date }[];
  readonly toolCallRows: readonly { type: string; data: unknown }[];
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
  readonly assistantRows: readonly { data: unknown; createdAt: Date }[];
}
