import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

export async function completeIntegrationUsage(input: {
  usageId: string;
  isAccepted: boolean;
  providerRequestId?: string;
  resultJson?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.integrationUsage.update({
    where: { id: input.usageId },
    data: {
      status: input.isAccepted ? "accepted" : "failed",
      providerRequestId: input.providerRequestId,
      resultJson: input.resultJson,
    },
  });
}
