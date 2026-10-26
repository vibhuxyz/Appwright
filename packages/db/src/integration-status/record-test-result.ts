import {
  isFailureStatus,
  summarizeIntegrationStatus,
  type IntegrationEnvironment,
  type IntegrationProvider,
  type RecordedIntegrationStatus,
} from "@repo/contracts";
import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

export interface IntegrationTestRecord {
  projectId: string;
  actorUserId: string;
  provider: IntegrationProvider;
  environment: IntegrationEnvironment;
  status: RecordedIntegrationStatus;
  message: string;
  testedAt: Date;
}

async function refreshIntegrationSummary(
  transaction: Prisma.TransactionClient,
  integration: { id: string; required: boolean },
  testedAt: Date,
): Promise<void> {
  const environments = await transaction.projectIntegrationEnvironment.findMany({
    where: { integrationId: integration.id },
    select: { status: true, lastError: true },
    orderBy: { environment: "asc" },
  });
  await transaction.projectIntegration.update({
    where: { id: integration.id },
    data: {
      status: summarizeIntegrationStatus({
        environmentStatuses: environments.map((environment) => environment.status),
        required: integration.required,
      }),
      lastTestedAt: testedAt,
      lastError: environments.find((environment) => environment.lastError)?.lastError ?? null,
    },
  });
}

export async function recordIntegrationTestResult(input: IntegrationTestRecord): Promise<void> {
  const lastError = isFailureStatus(input.status) ? input.message : null;
  await prisma.$transaction(async (transaction) => {
    const integration = await transaction.projectIntegration.upsert({
      where: { projectId_provider: { projectId: input.projectId, provider: input.provider } },
      create: { projectId: input.projectId, provider: input.provider, status: input.status },
      update: {},
      select: { id: true, required: true },
    });
    const environmentResult = { status: input.status, lastTestedAt: input.testedAt, lastError };
    await transaction.projectIntegrationEnvironment.upsert({
      where: { integrationId_environment: { integrationId: integration.id, environment: input.environment } },
      create: { integrationId: integration.id, environment: input.environment, ...environmentResult },
      update: environmentResult,
    });
    await refreshIntegrationSummary(transaction, integration, input.testedAt);
    await transaction.integrationAuditEvent.create({
      data: {
        projectId: input.projectId,
        actorUserId: input.actorUserId,
        provider: input.provider,
        environment: input.environment,
        action: "connection_tested",
        status: input.status,
      },
    });
  });
}
