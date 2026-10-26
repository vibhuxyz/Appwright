import { MANAGED_USAGE_LIMITS, type IntegrationProvider } from "@repo/contracts";
import { prisma } from "../lib/prisma";

export interface IntegrationUsageSummary {
  provider: IntegrationProvider;
  operation: string;
  used: number;
  limit: number;
  remaining: number;
}

export async function getIntegrationUsageSummary(
  projectId: string,
): Promise<IntegrationUsageSummary[]> {
  return Promise.all(MANAGED_USAGE_LIMITS.map(async ({ provider, operation, limit }) => {
    const usage = await prisma.integrationUsage.aggregate({
      where: {
        projectId,
        provider,
        operation,
        credentialMode: "APPWRITE_MANAGED",
        status: { in: ["reserved", "accepted", "failed"] },
      },
      _sum: { units: true },
    });
    const used = usage._sum.units ?? 0;
    return { provider, operation, used, limit, remaining: Math.max(limit - used, 0) };
  }));
}
