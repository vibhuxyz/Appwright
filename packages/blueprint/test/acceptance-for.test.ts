import { DEFAULT_DESIGN_BLOCK } from "@repo/contracts";
import { describe, expect, it } from "bun:test";
import { acceptanceFor } from "../src/acceptance-for";
import { buildTaskPrompt } from "../src/build-task-prompt";

const REQUIREMENTS = [
  { id: "admin", area: "admin", level: "required", reason: "managed", acceptance: ["Admin is protected"] },
  { id: "seo", area: "seo", level: "not-applicable", reason: "private", acceptance: ["Has sitemap"] },
];

describe("acceptanceFor", () => {
  it("returns the acceptance criteria of the required requirement matching the task type", () => {
    expect(acceptanceFor("ADMIN", REQUIREMENTS)).toEqual(["Admin is protected"]);
  });

  it("ignores not-applicable requirements and malformed data", () => {
    expect(acceptanceFor("SEO", REQUIREMENTS)).toEqual([]);
    expect(acceptanceFor("ADMIN", "not requirements")).toEqual([]);
    expect(acceptanceFor("ADMIN", null)).toEqual([]);
  });
});

describe("buildTaskPrompt", () => {
  const task = {
    type: "ADMIN",
    title: "Admin",
    owns: ["src/admin/**"],
    reads: [],
    acceptance: ["Admin is protected"],
    assetHints: [],
    entities: [],
    pages: [],
    features: [],
    design: DEFAULT_DESIGN_BLOCK,
  };

  it("lists acceptance criteria when the task has them", () => {
    expect(buildTaskPrompt(task, undefined)).toContain("- Admin is protected");
  });

  it("omits the section when there are none", () => {
    expect(buildTaskPrompt({ ...task, acceptance: [] }, undefined)).not.toContain("Acceptance criteria");
  });

  it("requires shadcn primitives on page tasks", () => {
    const prompt = buildTaskPrompt({ ...task, type: "page", title: "Page /: Home", acceptance: [] }, undefined);
    expect(prompt).toContain("Testimonials");
    expect(prompt).toContain("PageSkeleton");
    expect(prompt).toContain("Modal");
  });
});
