import { describe, expect, it } from "bun:test";
import { BlueprintSchema } from "@repo/contracts";
import { classifyIntent, planWorkspace, scopeFollowUp } from "../src";

const BASE = BlueprintSchema.parse({
  blueprintVersion: 1,
  intent: { type: "marketplace", domain: "food-delivery", complexity: "medium" },
  stack: { framework: "next", db: "postgres", orm: "prisma", auth: "authjs", styling: "tailwind" },
  entities: [
    { name: "Restaurant", fields: [{ name: "name", type: "String", required: true }] },
  ],
  pages: [{ route: "/", purpose: "browse restaurants" }],
  features: [],
  theme: { preset: "clean-modern", primary: "#E23744" },
});

const signal = new AbortController().signal;

describe("classifyIntent", () => {
  it("accepts structured output that matches the schema", async () => {
    const result = await classifyIntent(
      async () => ({ type: "crm", domain: "sales", complexity: "simple" }),
      "build a crm",
      signal,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects malformed model output instead of repairing it", async () => {
    const result = await classifyIntent(async () => ({ type: "crm" }), "build a crm", signal);
    expect(result.ok).toBe(false);
  });

  it("rejects an empty prompt without calling the model", async () => {
    let calls = 0;
    const result = await classifyIntent(async () => (calls += 1), "  ", signal);
    expect(result.ok).toBe(false);
    expect(calls).toBe(0);
  });
});

describe("scopeFollowUp", () => {
  it("a theme tweak is cosmetic and leaves other tasks untouched", () => {
    const proposed = { ...BASE, theme: { ...BASE.theme, primary: "#0000ff" } };
    const scope = scopeFollowUp(BASE, proposed);
    expect(scope.kind).toBe("cosmetic");
    expect(scope.requiresConfirmation).toBe(false);
    expect(scope.affectedTaskIds.length).toBeLessThan(
      scope.affectedTaskIds.length + scope.untouchedTaskIds.length,
    );
  });

  it("a new page is a feature with new tasks", () => {
    const proposed = {
      ...BASE,
      pages: [...BASE.pages, { route: "/cart", purpose: "cart", components: [] }],
    };
    const scope = scopeFollowUp(BASE, proposed);
    expect(scope.kind).toBe("feature");
    expect(scope.newTaskIds.length).toBeGreaterThan(0);
  });
});

describe("planWorkspace", () => {
  it("emits theme tokens only and dependencies implied by features", () => {
    const plan = planWorkspace({ ...BASE, features: ["auth", "payments"] });
    expect(plan.files.map((file) => file.path)).toEqual(["src/theme/tokens.css"]);
    expect(plan.files[0]?.content).toContain("--color-primary: #e23744;");
    expect(plan.dependencies).not.toContain("stripe");
    expect(plan.dependencies).toContain("next-auth");
    expect([...plan.dependencies]).toEqual([...plan.dependencies].sort());
  });
});
