import { describe, expect, it } from "bun:test";
import { isVerificationFailure, stopNoticeDescription, stopNoticeShortLabel, stopNoticeTitle } from "../src/features/agent/utils/stopNoticePresentation";

const VERIFICATION = { reason: "fatalError", detail: "❌ Verification failed and the same errors came back, so I stopped. Failing: lint (3 errors) in blur-text.tsx:245." };
const UNKNOWN = { reason: "fatalError", detail: "Provider returned 503" };

describe("stop notice for a verification failure", () => {
  it("says checks failed and shows which ones, instead of an unexpected error", () => {
    expect(isVerificationFailure(VERIFICATION)).toBe(true);
    expect(stopNoticeTitle(VERIFICATION)).toBe("Run Stopped: Checks Failed");
    expect(stopNoticeShortLabel(VERIFICATION, 0)).toBe("Stopped: Checks failed");
    expect(stopNoticeDescription(VERIFICATION, 0)).toBe("Verification failed and the same errors came back, so I stopped. Failing: lint (3 errors) in blur-text.tsx:245.");
  });

  it("keeps the generic wording for errors that are not verification failures", () => {
    expect(isVerificationFailure(UNKNOWN)).toBe(false);
    expect(stopNoticeTitle(UNKNOWN)).toBe("Run Stopped: Unexpected Error");
    expect(stopNoticeDescription(UNKNOWN, 0)).toContain("unexpected error");
  });

  it("does not treat other stop reasons as verification failures", () => {
    expect(isVerificationFailure({ reason: "cancelled", detail: "Verification" })).toBe(false);
  });
});
