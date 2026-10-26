import { describe, expect, it } from "bun:test";
import { validateArchitectureDecisions } from "../src";

describe("validateArchitectureDecisions", () => {
  it("requires no extra package for the Appwrite Razorpay gateway", () => {
    const issues = validateArchitectureDecisions(
      [{ capability: "payments", choice: "razorpay", reason: "needs.payments" }],
      [],
    );
    expect(issues).toEqual([]);
  });

  it("rejects a decision whose required package is not allowed", () => {
    const issues = validateArchitectureDecisions(
      [{ capability: "realtime", choice: "websockets", reason: "needs.realtime" }],
      ["zod"],
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe("package_not_allowed");
    expect(issues[0]?.message).toContain("ws");
  });

  it("needs no package for first-party upload, database search, or payments", () => {
    const issues = validateArchitectureDecisions(
      [
        { capability: "fileStorage", choice: "local-uploads", reason: "needs.fileUpload" },
        { capability: "search", choice: "mongodb-text-index", reason: "needs.search" },
        { capability: "payments", choice: "razorpay", reason: "needs.payments" },
      ],
      [],
    );
    expect(issues).toEqual([]);
  });

  it("reports one issue per missing package across multiple decisions", () => {
    const issues = validateArchitectureDecisions(
      [
        { capability: "realtime", choice: "websockets", reason: "needs.realtime" },
        { capability: "payments", choice: "razorpay", reason: "needs.payments" },
      ],
      [],
    );
    expect(issues.map((issue) => issue.message).join(" ")).toContain("ws");
    expect(issues).toHaveLength(1);
  });
});
