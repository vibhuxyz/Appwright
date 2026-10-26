import { describe, expect, it } from "bun:test";
import { BlueprintSchema, type Requirement } from "@repo/contracts";
import { detectNeeds, planBlueprint, resolveRequirements } from "../src";

const ENGINEERING_AREAS: readonly Requirement["area"][] = ["security", "media", "testing", "deploy"];

function resolve(prompt: string) {
  const draft = BlueprintSchema.parse({
    blueprintVersion: 1,
    intent: { type: "business-site", domain: "architecture", complexity: "simple" },
    stack: { framework: "next", db: "postgres", orm: "prisma", auth: "authjs", styling: "tailwind" },
    pages: [{ route: "/", purpose: "Portfolio home with hero photo and project gallery", components: ["Hero", "Gallery"] }],
    theme: { preset: "warm", primary: "#b45309" },
  });
  return resolveRequirements({ blueprint: draft, prompt, needs: detectNeeds(prompt) });
}

function levelOf(requirements: readonly Requirement[], area: Requirement["area"]): Requirement["level"] | undefined {
  return requirements.find((requirement) => requirement.area === area)?.level;
}

describe("engineering requirements follow stored data", () => {
  it("skips security, media, testing and deploy tasks for a static landing page", () => {
    const resolved = resolve("Build a landing page for a house plan studio in Ranchi with a photo gallery of past work.");
    expect(resolved.blueprint.stack.db).toBe("none");
    for (const area of ENGINEERING_AREAS) {
      expect(levelOf(resolved.requirements, area)).toBe("not-applicable");
    }
    const plan = planBlueprint(resolved.blueprint);
    if (!plan.ok) throw new Error(JSON.stringify(plan.issues));
    const taskTypes = new Set(plan.value.tasks.map((task) => task.type));
    for (const area of ENGINEERING_AREAS) expect(taskTypes.has(area)).toBe(false);
  });

  it("keeps security, testing and deploy for an app that stores data", () => {
    const resolved = resolve("Build a studio site where clients sign up and book appointments.");
    expect(resolved.blueprint.stack.db).toBe("mongodb");
    expect(levelOf(resolved.requirements, "security")).toBe("required");
    expect(levelOf(resolved.requirements, "testing")).toBe("required");
    expect(levelOf(resolved.requirements, "deploy")).toBe("required");
  });
});
