import { describe, expect, test } from "bun:test";
import { buildSystemPrompt, loadStackStandards, type Runtime } from "../src";

const emptyRuntime = {
  listDir: async () => [],
} as unknown as Runtime;

describe("stack standards", () => {
  test("name the fixed stack and the allowed packages", async () => {
    const standards = await loadStackStandards();
    for (const term of ["MongoDB", "Mongoose", "next-auth", "bcryptjs", "zustand", "@tanstack/react-query", "Zod"]) {
      expect(standards).toContain(term);
    }
  });

  test("are part of the system prompt", async () => {
    const prompt = await buildSystemPrompt(emptyRuntime);
    expect(prompt).toContain("PROJECT STACK AND STANDARDS");
    expect(prompt).toContain("connectDb");
  });

  test("never steer agents toward Prisma or SQL", async () => {
    const standards = await loadStackStandards();
    expect(standards).toContain("never use Prisma");
  });
});
