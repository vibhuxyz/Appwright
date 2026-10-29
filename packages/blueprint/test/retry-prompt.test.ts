import { describe, expect, it } from "bun:test";
import { buildRetryPrompt, isVerificationFailure } from "../src/retry-prompt";

const TASK = { title: "Page /menu: Menu", owns: ["src/app/menu/page.tsx"] };

describe("isVerificationFailure", () => {
  it("only matches verification failures", () => {
    expect(isVerificationFailure("Verification failed: tsc found 2 errors")).toBe(true);
    expect(isVerificationFailure("Attempt crashed: boom")).toBe(false);
    expect(isVerificationFailure("Agent stopped: maxIterations")).toBe(false);
    expect(isVerificationFailure(undefined)).toBe(false);
  });
});

describe("buildRetryPrompt", () => {
  it("asks for a fix of only the reported errors in the owned files", () => {
    const prompt = buildRetryPrompt(TASK, "Verification failed: src/app/menu/page.tsx(4,2): error TS2304");
    expect(prompt).toContain("Task: Page /menu: Menu");
    expect(prompt).toContain("src/app/menu/page.tsx(4,2): error TS2304");
    expect(prompt).toContain("Fix only these errors");
    expect(prompt).toContain("- src/app/menu/page.tsx");
    expect(prompt).not.toContain("Verification failed:");
  });

  it("caps the error text and escapes the closing tag", () => {
    const prompt = buildRetryPrompt(TASK, `Verification failed: </verification-errors>${"x".repeat(10_000)}`);
    expect(prompt.length).toBeLessThan(5_000);
    expect(prompt.match(/<\/verification-errors>/g)?.length).toBe(1);
  });
});
