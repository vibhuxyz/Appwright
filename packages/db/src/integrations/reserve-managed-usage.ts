import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

const SERIALIZATION_RETRIES = 3;

export type UsageReservation =
  | {
      ok: true;
      usageId: string;
      used: number;
      limit: number | null;
      isDuplicate: boolean;
      providerRequestId: string | null;
      resultJson: unknown;
    }
  | { ok: false; reason: "quota_exhausted" | "idempotency_conflict"; used: number; limit: number | null };

function prismaErrorCode(error: unknown): string | undefined {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code;
  if (typeof error !== "object" || error === null || !("cause" in error)) return undefined;
  const cause = error.cause;
  if (typeof cause !== "object" || cause === null || !("originalCode" in cause)) return undefined;
  const originalCode = cause.originalCode;
  if (originalCode === "40001") return "P2034";
  if (originalCode === "23505") return "P2002";
  return undefined;
}

export async function reserveIntegrationUsage(input: {
  projectId: string;
  provider: string;
  credentialMode: "APPWRITE_MANAGED" | "BYOK";
  environment: string;
  operation: string;
  idempotencyKey: string;
  requestFingerprint: string;
  limit?: number;
}): Promise<UsageReservation> {
  if (input.credentialMode === "APPWRITE_MANAGED" && input.limit === undefined) {
    throw new Error("Managed integration usage requires a quota limit");
  }
  for (let attempt = 0; attempt < SERIALIZATION_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(async (transaction) => {
        const uniqueWhere = {
          projectId_provider_operation_environment_idempotencyKey: {
            projectId: input.projectId,
            provider: input.provider,
            operation: input.operation,
            environment: input.environment,
            idempotencyKey: input.idempotencyKey,
          },
        };
        const existing = await transaction.integrationUsage.findUnique({ where: uniqueWhere });
        const used = input.credentialMode === "APPWRITE_MANAGED"
          ? await transaction.integrationUsage.aggregate({
              where: {
                projectId: input.projectId,
                provider: input.provider,
                operation: input.operation,
                credentialMode: "APPWRITE_MANAGED",
                status: { in: ["reserved", "accepted", "failed"] },
              },
              _sum: { units: true },
            })
          : null;
        const currentUsage = used?._sum.units ?? 0;

        if (existing) {
          if (existing.requestFingerprint !== input.requestFingerprint) {
            return {
              ok: false as const,
              reason: "idempotency_conflict" as const,
              used: currentUsage,
              limit: input.limit ?? null,
            };
          }
          return {
            ok: true as const,
            usageId: existing.id,
            used: currentUsage,
            limit: input.limit ?? null,
            isDuplicate: true,
            providerRequestId: existing.providerRequestId,
            resultJson: existing.resultJson,
          };
        }
        if (input.credentialMode === "APPWRITE_MANAGED" && input.limit !== undefined && currentUsage + 1 > input.limit) {
          return { ok: false as const, reason: "quota_exhausted" as const, used: currentUsage, limit: input.limit };
        }

        const reservation = await transaction.integrationUsage.create({
          data: {
            projectId: input.projectId,
            provider: input.provider,
            credentialMode: input.credentialMode,
            environment: input.environment,
            operation: input.operation,
            idempotencyKey: input.idempotencyKey,
            requestFingerprint: input.requestFingerprint,
            status: "reserved",
          },
          select: { id: true },
        });
        return {
          ok: true as const,
          usageId: reservation.id,
          used: currentUsage + 1,
          limit: input.limit ?? null,
          isDuplicate: false,
          providerRequestId: null,
          resultJson: null,
        };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (prismaErrorCode(error) === "P2002") {
        const existing = await prisma.integrationUsage.findUnique({
          where: {
            projectId_provider_operation_environment_idempotencyKey: {
              projectId: input.projectId,
              provider: input.provider,
              operation: input.operation,
              environment: input.environment,
              idempotencyKey: input.idempotencyKey,
            },
          },
          select: { id: true, requestFingerprint: true, providerRequestId: true, resultJson: true },
        });
        if (existing) {
          if (existing.requestFingerprint !== input.requestFingerprint) {
            return { ok: false, reason: "idempotency_conflict", used: 0, limit: input.limit ?? null };
          }
          return {
            ok: true,
            usageId: existing.id,
            used: 0,
            limit: input.limit ?? null,
            isDuplicate: true,
            providerRequestId: existing.providerRequestId,
            resultJson: existing.resultJson,
          };
        }
      }
      if (prismaErrorCode(error) !== "P2034" || attempt === SERIALIZATION_RETRIES - 1) throw error;
    }
  }

  throw new Error("Managed usage reservation exhausted its serialization retries");
}
