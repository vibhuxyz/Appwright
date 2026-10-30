import { describe, expect, it } from "bun:test";
import type { VerificationResult } from "@repo/contracts";
import { summarizeVerificationFailure } from "../src/worker/verification-summary";

const LINT_FAILURE: VerificationResult = {
  ok: false,
  check: "lint",
  errors: [
    { file: "/work/src/components/patterns/effects/text/blur-text.tsx", line: 245, col: 3, message: "Cannot access refs during render" },
    { file: "/work/src/components/patterns/effects/text/blur-text.tsx", line: 298, col: 7, message: "setState in effect" },
    { file: "/work/src/components/patterns/layout/overlay-nav.tsx", line: 51, col: 11, message: "Use Link" },
  ],
};

describe("summarizeVerificationFailure", () => {
  it("names each failing check with its error count and file locations", () => {
    expect(summarizeVerificationFailure([{ ok: true, check: "tsc", errors: [] }, LINT_FAILURE])).toBe(
      "Failing: lint (3 errors) in blur-text.tsx:245, blur-text.tsx:298, overlay-nav.tsx:51.",
    );
  });

  it("stays short and says how many locations were left out", () => {
    const many: VerificationResult = { ok: false, check: "tsc", errors: Array.from({ length: 9 }, (_, index) => ({ file: `src/f${index}.ts`, line: 1, message: "x" })) };
    expect(summarizeVerificationFailure([many])).toBe("Failing: tsc (9 errors) in f0.ts:1, f1.ts:1, f2.ts:1 and 6 more.");
  });

  it("works for errors without a file, and returns nothing when everything passed", () => {
    expect(summarizeVerificationFailure([{ ok: false, check: "build", errors: [{ message: "Build failed" }] }])).toBe("Failing: build (1 error).");
    expect(summarizeVerificationFailure([{ ok: true, check: "tsc", errors: [] }])).toBe("");
  });
});
