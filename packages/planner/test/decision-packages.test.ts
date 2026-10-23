import { describe, expect, it } from "bun:test";
import { validateArchitectureDecisions } from "../src";

describe("validateArchitectureDecisions", () => {
  it("passes when every required package is allowed", () => {
    const issues = validateArchitectureDecisions(
      [{ capability: "payments", choice: "stripe", reason: "needs.payments" }],
      ["stripe"],
    );
    expect(issues).toEqual([]);
  });

  it("rejects a decision whose package is not allowed", () => {
    const issues = validateArchitectureDecisions(
      [{ capability: "payments", choice: "stripe", reason: "needs.payments" }],
      ["zod"],
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe("package_not_allowed");
    expect(issues[0]?.message).toContain("stripe");
  });

  it("needs no package for local-uploads or mongodb-text-index", () => {
    const issues = validateArchitectureDecisions(
      [
        { capability: "fileStorage", choice: "local-uploads", reason: "needs.fileUpload" },
        { capability: "search", choice: "mongodb-text-index", reason: "needs.search" },
      ],
      [],
    );
    expect(issues).toEqual([]);
  });

  it("reports one issue per missing package across multiple decisions", () => {
    const issues = validateArchitectureDecisions(
      [
        { capability: "realtime", choice: "websockets", reason: "needs.realtime" },
        { capability: "payments", choice: "stripe", reason: "needs.payments" },
      ],
      [],
    );
    expect(issues.map((issue) => issue.message).join(" ")).toContain("ws");
    expect(issues.map((issue) => issue.message).join(" ")).toContain("stripe");
    expect(issues).toHaveLength(2);
  });
});
