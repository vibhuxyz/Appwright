import type { SseIntegrationConfigFrame } from "@repo/cache";

export function integrationRequestFrame(input: {
  id: string;
  sessionId: string;
  projectId: string;
  provider: string;
  reason: string;
  createdAt: Date;
}): SseIntegrationConfigFrame {
  return {
    kind: "integration_configuration_required",
    request: {
      id: input.id,
      sessionId: input.sessionId,
      projectId: input.projectId,
      provider: input.provider,
      required: true,
      reason: input.reason,
      environment: "development",
      createdAt: input.createdAt.toISOString(),
    },
  };
}
