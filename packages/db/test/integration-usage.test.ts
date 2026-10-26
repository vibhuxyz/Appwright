import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { getIntegrationUsageSummary, prisma, reserveIntegrationUsage } from "../src";

let projectId = "";
let userId = "";

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email: `integration-usage-${crypto.randomUUID()}@example.com`,
      hashPassword: "test-password",
    },
  });
  userId = user.id;
  const project = await prisma.project.create({
    data: {
      name: "Integration Usage Test",
      workspacePath: `/tmp/integration-usage-${crypto.randomUUID()}`,
      userId,
    },
  });
  projectId = project.id;
});

afterAll(async () => {
  if (projectId) await prisma.project.delete({ where: { id: projectId } });
  if (userId) await prisma.user.delete({ where: { id: userId } });
});

describe("Integration usage ledger", () => {
  it("enforces project quotas atomically and preserves idempotency", async () => {
    const reservations = [];
    for (let index = 0; index < 9; index += 1) {
      reservations.push(await reserveUsage(`seed-${index}`));
    }
    expect(reservations.every((reservation) => reservation.ok)).toBe(true);

    const [first, retry] = await Promise.all([
      reserveUsage("last-slot-a"),
      reserveUsage("last-slot-b"),
    ]);
    expect([first.ok, retry.ok].filter(Boolean)).toHaveLength(1);

    const duplicate = await reserveUsage("seed-0");
    expect(duplicate.ok).toBe(true);
    if (duplicate.ok) expect(duplicate.isDuplicate).toBe(true);

    const conflict = await reserveUsage("seed-0", "different-request");
    expect(conflict).toMatchObject({ ok: false, reason: "idempotency_conflict" });
  });

  it("does not charge BYOK operations against managed quota", async () => {
    const result = await reserveIntegrationUsage({
      projectId,
      provider: "email",
      credentialMode: "BYOK",
      environment: "production",
      operation: "send_transactional",
      idempotencyKey: "byok-production-1",
      requestFingerprint: "byok-request",
    });
    expect(result.ok).toBe(true);
    const usage = await getIntegrationUsageSummary(projectId);
    expect(usage.find((item) => item.provider === "email")?.used).toBe(10);
  });
});

function reserveUsage(idempotencyKey: string, requestFingerprint = "same-request") {
  return reserveIntegrationUsage({
    projectId,
    provider: "email",
    credentialMode: "APPWRITE_MANAGED",
    environment: "development",
    operation: "send_transactional",
    idempotencyKey,
    requestFingerprint,
    limit: 10,
  });
}
