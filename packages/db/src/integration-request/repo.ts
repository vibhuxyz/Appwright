import {
  IntegrationRequestStatusSchema,
  RequestableIntegrationProviderSchema,
  type IntegrationRequestStatus,
  type PendingIntegrationRequirement,
  type RequestableIntegrationProvider,
} from "@repo/contracts";
import { prisma } from "../lib/prisma";
import { loadDevelopmentStates } from "./development-status";
import { isDevelopmentSatisfied } from "./is-development-satisfied";
import { toPendingRequirement } from "./serialize";

const PENDING = "PENDING";
const UNKNOWN_STATUS_FALLBACK: IntegrationRequestStatus = "EXPIRED";
const MAX_PENDING_REQUESTS = 10;
const REQUIRED_BY_PLAN_REASON = "Your app plan uses this integration.";
const ROW_SELECT = {
  id: true,
  projectId: true,
  sessionId: true,
  provider: true,
  reason: true,
  status: true,
  createdAt: true,
} as const;

function parseStatus(status: string): IntegrationRequestStatus {
  const parsed = IntegrationRequestStatusSchema.safeParse(status);
  return parsed.success ? parsed.data : UNKNOWN_STATUS_FALLBACK;
}

export interface OpenedIntegrationRequest {
  id: string;
  provider: RequestableIntegrationProvider;
  reason: string;
}

export interface IntegrationRequestOutcome {
  id: string;
  provider: string;
  status: IntegrationRequestStatus;
  credentialMode: string | undefined;
}

export async function openIntegrationRequest(input: {
  sessionId: string;
  projectId: string;
  provider: RequestableIntegrationProvider;
  reason: string;
  expiresAt: Date;
}): Promise<OpenedIntegrationRequest> {
  const { sessionId, projectId, provider, reason, expiresAt } = input;
  const [, request] = await prisma.$transaction([
    prisma.projectIntegration.upsert({
      where: { projectId_provider: { projectId, provider } },
      create: { projectId, provider, required: true, status: "missing" },
      update: { required: true },
    }),
    prisma.integrationRequest.upsert({
      where: { sessionId_provider: { sessionId, provider } },
      create: { sessionId, projectId, provider, reason, expiresAt },
      update: { reason, expiresAt, status: PENDING, resolvedAt: null },
      select: { id: true },
    }),
  ]);
  return { id: request.id, provider, reason };
}

export async function openRequiredIntegrationRequests(input: {
  projectId: string;
  sessionId: string;
  expiresAt: Date;
}): Promise<OpenedIntegrationRequest[]> {
  const states = await loadDevelopmentStates({ projectId: input.projectId });
  const providers = [...states.values()]
    .filter((state) => state.required && !isDevelopmentSatisfied(state.provider, state.status))
    .flatMap((state) => {
      const parsed = RequestableIntegrationProviderSchema.safeParse(state.provider);
      return parsed.success ? [parsed.data] : [];
    })
    .sort();
  return Promise.all(providers.map((provider) =>
    openIntegrationRequest({ ...input, provider, reason: REQUIRED_BY_PLAN_REASON }),
  ));
}

export async function listPendingIntegrationRequests(
  sessionId: string,
  now: Date,
): Promise<PendingIntegrationRequirement[]> {
  const rows = await prisma.integrationRequest.findMany({
    where: { sessionId, status: PENDING, expiresAt: { gt: now } },
    orderBy: [{ createdAt: "asc" }, { provider: "asc" }],
    take: MAX_PENDING_REQUESTS,
    select: ROW_SELECT,
  });
  const firstRow = rows[0];
  if (!firstRow) return [];
  const states = await loadDevelopmentStates({
    projectId: firstRow.projectId,
    providers: rows.map((row) => row.provider),
  });
  return rows
    .filter((row) => !isDevelopmentSatisfied(row.provider, states.get(row.provider)?.status))
    .flatMap((row) => {
      const requirement = toPendingRequirement(row, states.get(row.provider));
      return requirement ? [requirement] : [];
    });
}

async function resolvePendingRequests(
  ids: readonly string[],
  status: Exclude<IntegrationRequestStatus, "PENDING">,
  now: Date,
): Promise<number> {
  if (ids.length === 0) return 0;
  const updated = await prisma.integrationRequest.updateMany({
    where: { id: { in: [...ids] }, status: PENDING },
    data: { status, resolvedAt: now },
  });
  return updated.count;
}

export async function dismissIntegrationRequest(input: { id: string; now: Date }): Promise<boolean> {
  return (await resolvePendingRequests([input.id], "DISMISSED", input.now)) === 1;
}

export async function expireIntegrationRequests(input: { ids: readonly string[]; now: Date }): Promise<number> {
  return resolvePendingRequests(input.ids, "EXPIRED", input.now);
}

export async function settleIntegrationRequests(input: {
  ids: readonly string[];
  now: Date;
}): Promise<{ outcomes: IntegrationRequestOutcome[]; pendingCount: number }> {
  const rows = await prisma.integrationRequest.findMany({ where: { id: { in: [...input.ids] } }, select: ROW_SELECT });
  const firstRow = rows[0];
  if (!firstRow) return { outcomes: [], pendingCount: 0 };
  const states = await loadDevelopmentStates({ projectId: firstRow.projectId, providers: rows.map((row) => row.provider) });
  const connectedIds = new Set(rows
    .filter((row) => row.status === PENDING && isDevelopmentSatisfied(row.provider, states.get(row.provider)?.status))
    .map((row) => row.id));
  await resolvePendingRequests([...connectedIds], "CONNECTED", input.now);
  const outcomes = rows.map((row): IntegrationRequestOutcome => ({
    id: row.id,
    provider: row.provider,
    status: connectedIds.has(row.id) ? "CONNECTED" : parseStatus(row.status),
    credentialMode: states.get(row.provider)?.credentialMode,
  }));
  return { outcomes, pendingCount: outcomes.filter((outcome) => outcome.status === PENDING).length };
}
