import { z } from "zod";
import { CredentialModeSchema, IntegrationStatusSchema } from "../environment";
import { REQUESTABLE_INTEGRATION_PROVIDERS } from "../integration-policy";
import { INTEGRATION_REQUEST_LIMITS, INTEGRATION_REQUEST_STATUSES } from "./constants";

export const RequestableIntegrationProviderSchema = z.enum(REQUESTABLE_INTEGRATION_PROVIDERS);

export const RequestIntegrationArgsSchema = z.object({
  provider: RequestableIntegrationProviderSchema,
  reason: z.string().trim().min(1).max(INTEGRATION_REQUEST_LIMITS.maxReasonChars),
});
export type RequestIntegrationArgs = z.infer<typeof RequestIntegrationArgsSchema>;

export const IntegrationRequestStatusSchema = z.enum(INTEGRATION_REQUEST_STATUSES);
export type IntegrationRequestStatus = z.infer<typeof IntegrationRequestStatusSchema>;

export const PendingIntegrationRequirementSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  sessionId: z.string(),
  provider: RequestableIntegrationProviderSchema,
  reason: z.string(),
  status: IntegrationRequestStatusSchema,
  developmentStatus: IntegrationStatusSchema,
  credentialMode: CredentialModeSchema.nullable(),
  lastError: z.string().nullable(),
  createdAt: z.string(),
});
export type PendingIntegrationRequirement = z.infer<typeof PendingIntegrationRequirementSchema>;

export const PendingIntegrationRequirementListSchema = z.object({
  items: z.array(PendingIntegrationRequirementSchema),
});
export type PendingIntegrationRequirementList = z.infer<typeof PendingIntegrationRequirementListSchema>;
