import { describe, expect, it } from "bun:test";
import { shouldRetryVerification, type VerifyOutcome } from "../src/verify";

describe("shouldRetryVerification", () => {
  it("retries after a single failure, well under the cap", () => {
    const history: VerifyOutcome[] = [{ passed: false, output: "error A" }];
    expect(shouldRetryVerification(history, 2)).toBe(true);
  });

  it("doesn't retry once the pass already succeeded", () => {
    const history: VerifyOutcome[] = [{ passed: true, output: "" }];
    expect(shouldRetryVerification(history, 2)).toBe(false);
  });

  it("doesn't retry once the attempt cap is reached", () => {
    const history: VerifyOutcome[] = [
      { passed: false, output: "error A" },
      { passed: false, output: "error B" },
      { passed: false, output: "error C" },
    ];
    expect(shouldRetryVerification(history, 2)).toBe(false);
  });

  it("doesn't retry when the last two failures produced the identical error", () => {
    const history: VerifyOutcome[] = [
      { passed: false, output: "Property 'foo' does not exist" },
      { passed: false, output: "Property 'foo' does not exist" },
    ];
    expect(shouldRetryVerification(history, 2)).toBe(false);
  });

  it("still retries when consecutive failures differ, even close to the cap", () => {
    const history: VerifyOutcome[] = [
      { passed: false, output: "error A" },
      { passed: false, output: "error B" },
    ];
    expect(shouldRetryVerification(history, 2)).toBe(true);
  });
});
