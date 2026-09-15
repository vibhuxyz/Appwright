import { describe, expect, it, afterAll } from "bun:test";
import { AddCreditsRequest, UserCreditsResponse } from "@repo/contracts";
import { prisma } from "@repo/db";
import { INITIAL_USER_CREDITS } from "../src/routes/auth";

describe("User Credit System", () => {
  const testEmail = `test-credit-${Date.now()}@example.com`;
  let testUserId: string | null = null;

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  });

  it("INITIAL_USER_CREDITS provides 150,000 tokens (~3 full todo apps)", () => {
    expect(INITIAL_USER_CREDITS).toBe(150_000);
  });

  it("AddCreditsRequest validates credit top-up requests", () => {
    // Valid positive integer
    const valid = AddCreditsRequest.safeParse({ amount: 50_000 });
    expect(valid.success).toBe(true);

    // Negative integer rejected
    const negative = AddCreditsRequest.safeParse({ amount: -10_000 });
    expect(negative.success).toBe(false);

    // Zero rejected
    const zero = AddCreditsRequest.safeParse({ amount: 0 });
    expect(zero.success).toBe(false);

    // Decimal rejected
    const float = AddCreditsRequest.safeParse({ amount: 50.5 });
    expect(float.success).toBe(false);
  });

  it("User model provisions 150,000 credits on initial signup and allows top-ups", async () => {
    // Create new user
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        hashPassword: "test-hash-password-for-credits",
        credits: INITIAL_USER_CREDITS,
      },
    });
    testUserId = user.id;

    // Verify initial credits
    expect(user.credits).toBe(150_000);

    // Simulate purchasing Starter Pack (+50,000 credits)
    const afterTopup = await prisma.user.update({
      where: { id: user.id },
      data: { credits: { increment: 50_000 } },
      select: { credits: true },
    });
    expect(afterTopup.credits).toBe(200_000);

    // Simulate deducting tokens used during app build (e.g. 35,000 tokens for todo app)
    const afterUsage = await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: 35_000 } },
      select: { credits: true },
    });
    expect(afterUsage.credits).toBe(165_000);
  });
});
