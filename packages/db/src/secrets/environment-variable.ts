import type { Prisma } from "../../generated/prisma/client";
import { encryptSecret } from "../lib/crypto";

export function environmentSecretKey(environment: string, key: string): string {
  return `${environment}:${key}`;
}

export async function writeProjectEnvironmentVariable(
  transaction: Prisma.TransactionClient,
  input: {
    projectId: string;
    environment: string;
    key: string;
    value: string;
    isSecret: boolean;
    description?: string;
  },
): Promise<void> {
  const secretKey = environmentSecretKey(input.environment, input.key);
  const secret = input.isSecret
    ? await transaction.secret.upsert({
        where: { projectId_key: { projectId: input.projectId, key: secretKey } },
        create: {
          projectId: input.projectId,
          key: secretKey,
          encryptedValue: encryptSecret(input.value),
        },
        update: { encryptedValue: encryptSecret(input.value) },
      })
    : null;

  await transaction.projectEnvironmentVariable.upsert({
    where: {
      projectId_environment_key: {
        projectId: input.projectId,
        environment: input.environment,
        key: input.key,
      },
    },
    create: {
      projectId: input.projectId,
      environment: input.environment,
      key: input.key,
      value: input.isSecret ? null : input.value,
      isSecret: input.isSecret,
      secretRef: secret?.id ?? null,
      description: input.description,
    },
    update: {
      value: input.isSecret ? null : input.value,
      isSecret: input.isSecret,
      secretRef: secret?.id ?? null,
      ...(input.description ? { description: input.description } : {}),
    },
  });

  if (!input.isSecret) {
    await transaction.secret.deleteMany({
      where: { projectId: input.projectId, key: secretKey },
    });
  }
}
