import { describe, expect, it } from "bun:test";
import { BlueprintSchema } from "@repo/contracts";
import {
  completenessIssues,
  detectNeeds,
  planBlueprint,
  resolveRequirements,
} from "../src";

const STACK = {
  framework: "next" as const,
  db: "postgres" as const,
  orm: "prisma" as const,
  auth: "authjs" as const,
  styling: "tailwind" as const,
};

function seed(prompt: string, extra: { pages?: { route: string; purpose: string; components: string[] }[] } = {}) {
  const draft = BlueprintSchema.parse({
    blueprintVersion: 1,
    intent: { type: "business-site", domain: "bakery", complexity: "medium" },
    stack: STACK,
    pages: extra.pages ?? [{ route: "/", purpose: "Bakery home with hero photos", components: ["Hero"] }],
    theme: { preset: "warm", primary: "#b45309" },
  });
  return resolveRequirements({ blueprint: draft, prompt, needs: detectNeeds(prompt) });
}

describe("bakery blueprint completeness", () => {
  it("plans a browse-only bakery without order workflows", () => {
    const prompt = "Build a bakery website to browse the menu. Catalog only, no online ordering.";
    const resolved = seed(prompt);
    expect(resolved.blueprint.pages.find((page) => page.route === "/")?.components).toEqual(
      expect.arrayContaining(["Testimonials", "Carousel"]),
    );
    expect(resolved.blueprint.workflows?.find((workflow) => workflow.kind === "pickup-order")?.inScope).toBe(false);
    expect(resolved.blueprint.entities).toEqual([]);
    expect(resolved.blueprint.stack.db).toBe("none");
    expect(resolved.blueprint.requirements?.find((requirement) => requirement.area === "admin")?.level).toBe(
      "not-applicable",
    );
    const plan = planBlueprint(resolved.blueprint);
    if (!plan.ok) throw new Error(JSON.stringify(plan.issues));
    expect(plan.value.tasks.length).toBeGreaterThan(0);
  });

  it("plans pickup orders with an Order model and operational admin", () => {
    const prompt = "Build a bakery where customers can place standard pickup orders.";
    const resolved = seed(prompt);
    expect(resolved.blueprint.entities.some((entity) => entity.name === "Order")).toBe(true);
    expect(resolved.blueprint.stack.db).toBe("mongodb");
    expect(resolved.blueprint.pages.some((page) => page.route === "/order")).toBe(true);
    const admin = resolved.blueprint.pages.find((page) => page.route === "/admin");
    expect(admin?.components).toEqual(expect.arrayContaining(["PendingOrders", "TodaysPickups"]));
    const plan = planBlueprint(resolved.blueprint);
    if (!plan.ok) throw new Error(JSON.stringify(plan.issues));
  });

  it("plans standard and custom orders plus pop-up locations", () => {
    const prompt =
      "Build a bakery application where customers can place standard pickup orders and custom cake or event requests. The business has a storefront and pop-up locations.";
    const resolved = seed(prompt);
    const names = resolved.blueprint.entities.map((entity) => entity.name);
    expect(names).toEqual(expect.arrayContaining(["Order", "CustomRequest", "Location"]));
    expect(resolved.blueprint.pages.some((page) => page.route === "/custom-order")).toBe(true);
    expect(resolved.blueprint.pages.some((page) => page.route === "/locations")).toBe(true);
    expect(resolved.blueprint.entities.some((entity) => entity.name === "OrderItem")).toBe(true);
    expect(resolved.blueprint.pages.some((page) => page.route === "/admin/order-item")).toBe(false);
    const plan = planBlueprint(resolved.blueprint);
    if (!plan.ok) throw new Error(JSON.stringify(plan.issues));
  });

  it("keeps an existing admin home instead of duplicating it", () => {
    const prompt = "Build a bakery where customers can place standard pickup orders. We already have an admin dashboard.";
    const resolved = seed(prompt, {
      pages: [
        { route: "/", purpose: "Home", components: ["Hero"] },
        { route: "/admin", purpose: "Existing ops dashboard", components: ["ExistingBoard"] },
      ],
    });
    const adminPages = resolved.blueprint.pages.filter((page) => page.route === "/admin");
    expect(adminPages).toHaveLength(1);
    expect(adminPages[0]?.purpose).toBe("Existing ops dashboard");
  });

  it("flags a pickup workflow that has no Order model", () => {
    const issues = completenessIssues(
      BlueprintSchema.parse({
        blueprintVersion: 1,
        intent: { type: "business-site", domain: "bakery", complexity: "medium" },
        stack: STACK,
        pages: [{ route: "/", purpose: "Home", components: ["Hero"] }],
        theme: { preset: "warm", primary: "#b45309" },
        workflows: [
          {
            id: "pickup-order",
            kind: "pickup-order",
            name: "Pickup",
            inScope: true,
            reason: "orders",
            actors: ["customer"],
            steps: ["Order"],
          },
        ],
      }),
    );
    expect(issues.some((issue) => issue.code === "missing_workflow")).toBe(true);
  });
});
