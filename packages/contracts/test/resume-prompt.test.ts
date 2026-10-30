import { describe, expect, it } from "bun:test";
import { RESUME_PROMPT, isResumePrompt, resumePrompt } from "../src";

describe("resume prompt", () => {
  it("is the plain resume sentence when there is nothing to add", () => {
    expect(resumePrompt()).toBe(RESUME_PROMPT);
    expect(resumePrompt("   ")).toBe(RESUME_PROMPT);
  });

  it("carries the stop reason on one flattened line so the agent fixes exactly that", () => {
    const prompt = resumePrompt("Verification failed.\n  Failing: lint (3 errors) in blur-text.tsx:245.");
    expect(prompt.startsWith(RESUME_PROMPT)).toBe(true);
    expect(prompt).toContain("The last run stopped because: Verification failed. Failing: lint (3 errors) in blur-text.tsx:245.");
  });

  it("is recognised with or without the extra context, and not for ordinary prompts", () => {
    expect(isResumePrompt(RESUME_PROMPT)).toBe(true);
    expect(isResumePrompt(resumePrompt("lint failed"))).toBe(true);
    expect(isResumePrompt(`  ${RESUME_PROMPT}`)).toBe(true);
    expect(isResumePrompt("Build a bakery website")).toBe(false);
    expect(isResumePrompt("Please continue building the remaining tasks")).toBe(false);
  });
});
