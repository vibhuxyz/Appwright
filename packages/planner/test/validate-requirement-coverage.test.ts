import { describe, expect, it } from "bun:test";
import type { Requirement } from "@repo/contracts";
import { planBlueprint, requirementCoverageIssues, type TaskSpec } from "../src";

function spec(id: string, type: TaskSpec["type"]): TaskSpec {
  return {
    id,
    type,
    title: id,
    owns: [`src/${id}/**`],
    reads: [],
    riskTier: "low",
    capability: "fast_coding",
    verification: { tier: 1 },
  };
}

describe("requirementCoverageIssues", () => {
  it("reports a required requirement with no matching task type", () => {
    const blueprint = {
      requirements: [
        { id: "security-default", area: "security", level: "required", reason: "x", acceptance: [] },
      ] satisfies Requirement[],
    };

    const issues = requirementCoverageIssues(blueprint, []);
    expect(issues).toEqual([
      {
        code: "uncovered_requirement",
        message:
          'Requirement "security-default" (security) is required but no task covers it',
      },
    ]);
  });

  it("passes when a task of the matching type exists", () => {
    const blueprint = {
      requirements: [
        { id: "security-default", area: "security", level: "required", reason: "x", acceptance: [] },
      ] satisfies Requirement[],
    };

    expect(requirementCoverageIssues(blueprint, [spec("security", "security")])).toEqual([]);
  });

  it("ignores conditional and not-applicable requirements", () => {
    const blueprint = {
      requirements: [
        { id: "seo-conditional", area: "seo", level: "conditional", reason: "x", acceptance: [] },
        { id: "admin-na", area: "admin", level: "not-applicable", reason: "x", acceptance: [] },
      ] satisfies Requirement[],
    };

    expect(requirementCoverageIssues(blueprint, [])).toEqual([]);
  });
});

describe("planBlueprint with requirements", () => {
  const WITH_REQUIREMENTS = {
    blueprintVersion: 1,
    intent: { type: "business-site", domain: "bakery", complexity: "simple" },
    stack: {
      framework: "next",
      db: "postgres",
      orm: "prisma",
      auth: "authjs",
      styling: "tailwind",
    },
    entities: [],
    pages: [{ route: "/", purpose: "browse the menu", components: ["MenuList"] }],
    features: [],
    theme: { preset: "clean-modern", primary: "#e23744" },
    requirements: [
      { id: "security-default", area: "security", level: "required", reason: "x", acceptance: [] },
    ],
  };

  it("still plans successfully because compileTasks always covers every required area", () => {
    const result = planBlueprint(WITH_REQUIREMENTS);
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    expect(result.value.tasks.some((task) => task.type === "security")).toBe(true);
  });
});
