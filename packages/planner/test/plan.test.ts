import { describe, expect, it } from "bun:test";
import type { Requirement } from "@repo/contracts";
import {
  MAX_TASKS_PER_PLAN,
  planBlueprint,
  riskTierFor,
  validateTaskGraph,
  type TaskSpec,
} from "../src";
import { MAX_TOTAL_ENTITIES, MAX_TOTAL_PAGES } from "../src/universal/constants";

const FOOD_DELIVERY = {
  blueprintVersion: 1,
  intent: {
    type: "marketplace",
    domain: "food-delivery",
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
      name: "Restaurant",
      fields: [{ name: "name", type: "String", required: true }],
      relations: ["Order"],
    },
    {
      name: "Order",
      fields: [{ name: "total", type: "Int", required: true }],
      relations: [],
    },
  ],
  pages: [
    {
      route: "/",
      purpose: "browse restaurants",
      components: ["RestaurantCard"],
    },
    { route: "/r/[id]", purpose: "menu + add to cart" },
  ],
  features: ["auth"],
  theme: { preset: "clean-modern", primary: "#e23744" },
};

function spec(id: string, owns: string[], reads: string[]): TaskSpec {
  return {
    id,
    type: "page",
    title: id,
    owns,
    reads,
    riskTier: "low",
    capability: "fast_coding",
    verification: { tier: 1 },
  };
}

describe("planBlueprint", () => {
  it("compiles a valid blueprint into an ordered, cycle-free plan", () => {
    const result = planBlueprint(FOOD_DELIVERY);
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    const { tasks, graph } = result.value;

    expect(graph.levels[0]).toEqual(["scaffold"]);
    expect(graph.levels.flat().sort()).toEqual(tasks.map((t) => t.id).sort());
    expect(graph.dependsOn.get("seed")).toContain("schema");
    expect(graph.dependsOn.get("page-home")).toContain("components");
  });

  it("serialises the schema and seed tasks that share the database", () => {
    const result = planBlueprint(FOOD_DELIVERY);
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    expect(result.value.graph.ownershipConflicts).toContainEqual([
      "schema",
      "seed",
    ]);
  });

  it("rejects a dangling relation and a duplicate route", () => {
    const broken = {
      ...FOOD_DELIVERY,
      entities: [
        {
          name: "Order",
          fields: [{ name: "total", type: "Int", required: true }],
          relations: ["Ghost"],
        },
      ],
      pages: [FOOD_DELIVERY.pages[0], FOOD_DELIVERY.pages[0]],
    };
    const result = planBlueprint(broken);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((i) => i.code).sort()).toEqual([
      "dangling_relation",
      "duplicate_route",
    ]);
  });

  it("rejects a schema-invalid blueprint", () => {
    const result = planBlueprint({ ...FOOD_DELIVERY, pages: [] });
    expect(result.ok).toBe(false);
  });

  it("rejects a plan whose estimated cost exceeds the run budget", () => {
    const result = planBlueprint(FOOD_DELIVERY, 1);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((i) => i.code)).toContain("over_budget");
  });

  it("accepts a plan within the run budget", () => {
    const result = planBlueprint(FOOD_DELIVERY, 100_000);
    expect(result.ok).toBe(true);
  });

  it("rejects a plan with a package not in the allowlist", () => {
    const result = planBlueprint(FOOD_DELIVERY, undefined, ["zod"]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((i) => i.code)).toContain("package_not_allowed");
  });

  it("accepts a plan whose packages are all in the allowlist", () => {
    const result = planBlueprint(FOOD_DELIVERY, undefined, ["next-auth", "bcryptjs"]);
    expect(result.ok).toBe(true);
  });
});

describe("validateTaskGraph", () => {
  it("reports a cycle as an issue instead of throwing", () => {
    const result = validateTaskGraph([
      spec("a", ["src/a/**"], ["src/b/**"]),
      spec("b", ["src/b/**"], ["src/a/**"]),
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("dependency_cycle");
  });

  it("rejects duplicate ids and absolute ownership paths", () => {
    const result = validateTaskGraph([
      spec("a", ["/etc/**"], []),
      spec("a", ["src/x"], []),
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((i) => i.code).sort()).toEqual([
      "duplicate_task_id",
      "invalid_ownership",
    ]);
  });

  it("warns on whole-directory ownership", () => {
    const result = validateTaskGraph([spec("a", ["src/**"], [])]);
    if (!result.ok) throw new Error("expected ok");
    expect(result.value.warnings[0]?.code).toBe("broad_ownership");
  });

  it("accepts a 45-task plan (universal blueprints exceed the old 40 cap)", () => {
    const result = validateTaskGraph(manyTasks(45));
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    expect(result.value.levels.flat()).toHaveLength(45);
  });

  it("rejects a plan above the compiled-blueprint ceiling", () => {
    const result = validateTaskGraph(manyTasks(MAX_TASKS_PER_PLAN + 1));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toEqual([
      {
        code: "too_many_tasks",
        message: `Plan has ${MAX_TASKS_PER_PLAN + 1} tasks, limit is ${MAX_TASKS_PER_PLAN}`,
      },
    ]);
  });
});

const REQUIRED_AREAS: readonly Requirement["area"][] = [
  "security",
  "admin",
  "media",
  "seo",
  "testing",
  "deploy",
];

function maxUniversalBlueprint() {
  return {
    ...FOOD_DELIVERY,
    features: ["auth", "payments"],
    entities: Array.from({ length: MAX_TOTAL_ENTITIES }, (_, index) => ({
      name: `Entity${index + 1}`,
      fields: [{ name: "name", type: "String", required: true }],
      relations: [],
    })),
    pages: Array.from({ length: MAX_TOTAL_PAGES }, (_, index) => ({
      route: index === 0 ? "/" : `/page-${index}`,
      purpose: `page ${index}`,
      components: [],
    })),
    requirements: REQUIRED_AREAS.map((area) => ({
      id: area,
      area,
      level: "required" as const,
      reason: "coverage",
      acceptance: [],
    })),
  };
}

function manyTasks(count: number): TaskSpec[] {
  return Array.from({ length: count }, (_, index) =>
    spec(`t${index}`, [`src/t${index}/**`], []),
  );
}

describe("universal plan size", () => {
  it("plans a max-size blueprint that compiles to more than 40 tasks", () => {
    const result = planBlueprint(maxUniversalBlueprint());
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    expect(result.value.tasks.length).toBeGreaterThan(40);
    expect(result.value.tasks.length).toBeLessThanOrEqual(MAX_TASKS_PER_PLAN);
  });
});

describe("riskTierFor", () => {
  it("only raises the tier, never lowers it", () => {
    expect(riskTierFor("page", "high")).toBe("high");
    expect(riskTierFor("schema", "low")).toBe("high");
  });
});
