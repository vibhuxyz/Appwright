import {
  toRecordedStatus,
  type IntegrationEnvironment,
  type IntegrationProvider,
  type RecordedIntegrationStatus,
} from "@repo/contracts";
import { testManagedIntegration } from "../integration-runtime";
import { prisma, testIntegration } from "../lib";
import { recordIntegrationTestResult } from "./record-test-result";

const MANAGED_CREDENTIAL_MODE = "APPWRITE_MANAGED";

export interface IntegrationTestOutcome {
  provider: IntegrationProvider;
  environment: IntegrationEnvironment;
  status: RecordedIntegrationStatus;
  message: string;
  testedAt: string;
}

export async function runIntegrationTest(input: {
  projectId: string;
  actorUserId: string;
  provider: IntegrationProvider;
  environment: IntegrationEnvironment;
}): Promise<IntegrationTestOutcome> {
  const configuration = await prisma.projectIntegrationEnvironment.findFirst({
    where: {
      environment: input.environment,
      integration: { projectId: input.projectId, provider: input.provider },
    },
    select: { credentialMode: true },
  });
  const test = configuration?.credentialMode === MANAGED_CREDENTIAL_MODE
    ? await testManagedIntegration(input)
    : await testIntegration(input);
  const status = toRecordedStatus(test.status);
  const testedAt = new Date();
  await recordIntegrationTestResult({ ...input, status, message: test.message, testedAt });
  return {
    provider: input.provider,
    environment: input.environment,
    status,
    message: test.message,
    testedAt: testedAt.toISOString(),
  };
}
