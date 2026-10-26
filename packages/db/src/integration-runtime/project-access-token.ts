import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "../../generated/prisma/client";
import { decryptSecret, encryptSecret } from "../lib/crypto";
import { prisma } from "../lib/prisma";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getProjectIntegrationToken(
  projectId: string,
  environment: string,
): Promise<string> {
  const existing = await prisma.projectIntegrationAccessToken.findUnique({
    where: { projectId_environment: { projectId, environment } },
    select: { encryptedToken: true },
  });
  if (existing) return decryptSecret(existing.encryptedToken);

  const token = `appw_${randomBytes(32).toString("base64url")}`;
  try {
    await prisma.projectIntegrationAccessToken.create({
      data: {
        projectId,
        environment,
        tokenHash: hashToken(token),
        encryptedToken: encryptSecret(token),
      },
    });
    return token;
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    const concurrentToken = await prisma.projectIntegrationAccessToken.findUnique({
      where: { projectId_environment: { projectId, environment } },
      select: { encryptedToken: true },
    });
    if (!concurrentToken) throw error;
    return decryptSecret(concurrentToken.encryptedToken);
  }
}

export async function findIntegrationProjectScope(
  token: string,
): Promise<{ projectId: string; environment: string } | null> {
  const record = await prisma.projectIntegrationAccessToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { projectId: true, environment: true },
  });
  return record ?? null;
}

export async function rotateProjectIntegrationToken(
  projectId: string,
  environment: string,
): Promise<string> {
  const token = `appw_${randomBytes(32).toString("base64url")}`;
  await prisma.projectIntegrationAccessToken.upsert({
    where: { projectId_environment: { projectId, environment } },
    create: {
      projectId,
      environment,
      tokenHash: hashToken(token),
      encryptedToken: encryptSecret(token),
    },
    update: {
      tokenHash: hashToken(token),
      encryptedToken: encryptSecret(token),
    },
  });
  return token;
}
