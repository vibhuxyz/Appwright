import { describe, expect, it } from "bun:test";
import {
  planBlueprint,
  riskTierFor,
  validateTaskGraph,
  type TaskSpec,
} from "../src";

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
});

describe("riskTierFor", () => {
  it("only raises the tier, never lowers it", () => {
    expect(riskTierFor("page", "high")).toBe("high");
    expect(riskTierFor("schema", "low")).toBe("high");
  });
});
