import {
  CredentialModeSchema,
  RequestableIntegrationProviderSchema,
  IntegrationRequestStatusSchema,
  type PendingIntegrationRequirement,
} from "@repo/contracts";
import { normalizeEnvironmentStatus } from "../environment-view";
import type { DevelopmentIntegrationState } from "./development-status";

export interface IntegrationRequestRow {
  id: string;
  projectId: string;
  sessionId: string;
  provider: string;
  reason: string;
  status: string;
  createdAt: Date;
}

export function toPendingRequirement(
  row: IntegrationRequestRow,
  state: DevelopmentIntegrationState | undefined,
): PendingIntegrationRequirement | null {
  const provider = RequestableIntegrationProviderSchema.safeParse(row.provider);
  const status = IntegrationRequestStatusSchema.safeParse(row.status);
  if (!provider.success || !status.success) return null;
  const credentialMode = CredentialModeSchema.safeParse(state?.credentialMode);
  return {
    id: row.id,
    projectId: row.projectId,
    sessionId: row.sessionId,
    provider: provider.data,
    reason: row.reason,
    status: status.data,
    developmentStatus: normalizeEnvironmentStatus(state?.status ?? "configuration_required"),
    credentialMode: credentialMode.success ? credentialMode.data : null,
    lastError: state?.lastError ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
