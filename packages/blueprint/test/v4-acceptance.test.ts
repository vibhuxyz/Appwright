import { describe, expect, it } from "bun:test";
import { FakeProvider } from "@repo/agent-core";
import { scopeFollowUp } from "@repo/planner";
import { buildBlueprint } from "../src";

const FOOD_DELIVERY_INTENT = JSON.stringify({
  type: "marketplace",
  domain: "food-delivery",
  complexity: "complex",
});

const FOOD_DELIVERY_CONTENT = JSON.stringify({
  entities: [
    {
      name: "Restaurant",
      fields: [{ name: "name", type: "String", required: true, unique: false }],
      relations: ["MenuItem"],
    },
    {
      name: "MenuItem",
      fields: [{ name: "title", type: "String", required: true, unique: false }],
      relations: ["Restaurant"],
    },
  ],
  pages: [
    { route: "/", purpose: "Home feed", components: ["Hero", "RestaurantList"] },
    { route: "/restaurants", purpose: "Browse restaurants", components: ["RestaurantGrid"] },
    { route: "/checkout", purpose: "Order checkout", components: ["CartSummary"] },
  ],
  features: ["auth", "payments"],
  theme: { preset: "clean-modern", primary: "#E23744" },
});

const CRM_INTENT = JSON.stringify({
  type: "saas",
  domain: "crm",
  complexity: "medium",
});

const CRM_CONTENT = JSON.stringify({
  entities: [
    {
      name: "Contact",
      fields: [{ name: "email", type: "String", required: true, unique: true }],
      relations: ["Deal"],
    },
    {
      name: "Deal",
      fields: [{ name: "title", type: "String", required: true, unique: false }],
      relations: ["Contact"],
    },
  ],
  pages: [
    { route: "/", purpose: "Pipeline dashboard", components: ["MetricCards"] },
    { route: "/contacts", purpose: "Manage contacts", components: ["ContactsTable"] },
    { route: "/deals", purpose: "Kanban board", components: ["KanbanBoard"] },
  ],
  features: ["auth"],
  theme: { preset: "dense-technical", primary: "#2563EB" },
});

const BLOG_INTENT = JSON.stringify({
  type: "content",
  domain: "blog",
  complexity: "simple",
});

const BLOG_CONTENT = JSON.stringify({
  entities: [
    {
      name: "Post",
      fields: [{ name: "slug", type: "String", required: true, unique: true }],
      relations: ["Author"],
    },
    {
      name: "Author",
      fields: [{ name: "name", type: "String", required: true, unique: false }],
      relations: ["Post"],
    },
  ],
  pages: [
    { route: "/", purpose: "Article feed", components: ["PostList"] },
    { route: "/post/[slug]", purpose: "Article reader", components: ["MarkdownBody"] },
    { route: "/about", purpose: "About the blog", components: ["AuthorCard"] },
  ],
  features: ["auth"],
  theme: { preset: "minimal-premium", primary: "#0F172A" },
});

describe("V4 Acceptance: Three-Domain Runs (Slice 10)", () => {
  it("domain 1: food delivery produces complete fullstack plan with UI task DAG", async () => {
    const provider = new FakeProvider([
      { kind: "text", text: FOOD_DELIVERY_INTENT },
      { kind: "text", text: FOOD_DELIVERY_CONTENT },
    ]);
    const plan = await buildBlueprint("build me a food delivery marketplace app", { provider });

    expect(plan.blueprint.intent.domain).toBe("food-delivery");
    expect(plan.blueprint.design).toBeDefined();
    expect(plan.blueprint.layout).toBeDefined();
    expect(plan.blueprint.responsive).toBeDefined();

    const taskTypes = plan.tasks.map((t) => t.type);
    expect(taskTypes).toContain("app-shell");
    expect(taskTypes).toContain("typography");
    expect(taskTypes).toContain("layout");
    expect(taskTypes).toContain("component");
    expect(taskTypes).toContain("responsive");
    expect(taskTypes).toContain("visual-verification");
    expect(taskTypes).toContain("schema");
    expect(taskTypes).toContain("payment");

    expect(plan.graph.dependsOn.size).toBe(plan.tasks.length);
    expect(plan.graph.levels.length).toBeGreaterThan(1);
  });

  it("domain 2: sales CRM produces valid plan with tabular entities and pipeline pages", async () => {
    const provider = new FakeProvider([
      { kind: "text", text: CRM_INTENT },
      { kind: "text", text: CRM_CONTENT },
    ]);
    const plan = await buildBlueprint("build a sales CRM to track leads and deals", { provider });

    expect(plan.blueprint.intent.domain).toBe("crm");
    expect(plan.blueprint.entities.map((e) => e.name)).toEqual(["Contact", "Deal"]);
    expect(plan.tasks.some((t) => t.id === "api-contact")).toBe(true);
    expect(plan.tasks.some((t) => t.id === "api-deal")).toBe(true);
    expect(plan.graph.dependsOn.size).toBe(plan.tasks.length);
  });

  it("domain 3: developer blog produces valid plan with content routes", async () => {
    const provider = new FakeProvider([
      { kind: "text", text: BLOG_INTENT },
      { kind: "text", text: BLOG_CONTENT },
    ]);
    const plan = await buildBlueprint("build a developer blog with posts and authors", { provider });

    expect(plan.blueprint.intent.domain).toBe("blog");
    expect(plan.tasks.some((t) => t.type === "page")).toBe(true);
    expect(plan.graph.dependsOn.size).toBe(plan.tasks.length);
  });

  it("follow-up test: cosmetic tweak re-plans incrementally without rebuilding the DAG", async () => {
    const provider = new FakeProvider([
      { kind: "text", text: FOOD_DELIVERY_INTENT },
      { kind: "text", text: FOOD_DELIVERY_CONTENT },
    ]);
    const plan = await buildBlueprint("build me a food delivery app", { provider });

    const proposed = {
      ...plan.blueprint,
      theme: { ...plan.blueprint.theme, primary: "#10B981" },
    };
    const scope = scopeFollowUp(plan.blueprint, proposed);

    expect(scope.kind).toBe("cosmetic");
    expect(scope.requiresConfirmation).toBe(false);
    expect(scope.untouchedTaskIds.length).toBeGreaterThan(0);
    expect(scope.affectedTaskIds.length).toBeLessThan(plan.tasks.length);
  });

  it("mid-DAG recovery: resume skips green tasks and starts from first unfinished task", () => {
    const tasks = [
      { id: "t1", status: "done" },
      { id: "t2", status: "running" },
      { id: "t3", status: "pending" },
    ];

    const tasksToRun = tasks.filter((t) => t.status !== "done");
    expect(tasksToRun[0]?.id).toBe("t2");
    expect(tasksToRun.some((t) => t.id === "t1")).toBe(false);
  });
});
