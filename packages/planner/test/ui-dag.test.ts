import { describe, expect, it } from "bun:test";
import { planBlueprint } from "../src";

const SAMPLE_APP = {
  blueprintVersion: 1,
  intent: {
    type: "saas",
    domain: "crm",
    complexity: "medium",
  },
  stack: {
    framework: "next",
    db: "postgres",
    orm: "prisma",
    auth: "authjs",
    styling: "tailwind",
  },
  entities: [
    {
      name: "Contact",
      fields: [{ name: "email", type: "String", required: true }],
      relations: [],
    },
  ],
  pages: [
    {
      route: "/",
      purpose: "dashboard",
      components: ["MetricsGrid"],
    },
    {
      route: "/contacts",
      purpose: "list contacts",
      components: ["ContactsTable"],
    },
  ],
  features: ["auth"],
  theme: { preset: "clean-modern", primary: "#111827" },
};

describe("UI task DAG (Slice 4c)", () => {
  it("compiles UI-shaped task types: design system -> app shell -> typography -> layout -> components -> pages -> responsive -> visual verification", () => {
    const plan = planBlueprint(SAMPLE_APP);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;

    const taskTypes = plan.value.tasks.map((t) => t.type);
    expect(taskTypes).toContain("theme");
    expect(taskTypes).toContain("app-shell");
    expect(taskTypes).toContain("typography");
    expect(taskTypes).toContain("layout");
    expect(taskTypes).toContain("component");
    expect(taskTypes).toContain("page");
    expect(taskTypes).toContain("responsive");
    expect(taskTypes).toContain("visual-verification");

    const appShell = plan.value.tasks.find((t) => t.type === "app-shell");
    const theme = plan.value.tasks.find((t) => t.type === "theme");
    const layout = plan.value.tasks.find((t) => t.type === "layout");
    const responsive = plan.value.tasks.find((t) => t.type === "responsive");
    const visual = plan.value.tasks.find((t) => t.type === "visual-verification");

    expect(appShell?.reads).toContain("src/app/globals.css");
    expect(theme?.owns).toContain("src/app/globals.css");

    const appShellDeps = plan.value.graph.dependsOn.get("app-shell") ?? [];
    expect(appShellDeps).toContain("theme");

    const layoutDeps = plan.value.graph.dependsOn.get("layout") ?? [];
    expect(layoutDeps).toContain("app-shell");
    expect(layoutDeps).toContain("typography");

    const visualDeps = plan.value.graph.dependsOn.get("visual-verification") ?? [];
    expect(visualDeps).toContain("responsive");
  });
});
