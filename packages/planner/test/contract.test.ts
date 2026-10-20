import { describe, expect, it } from "bun:test";
import { PlanContractSchema, planBlueprint, toPlanContract } from "../src";

const BLUEPRINT = {
  blueprintVersion: 1,
  intent: { type: "marketplace", domain: "food-delivery", complexity: "medium" },
  stack: {
    framework: "next",
    db: "postgres",
    orm: "prisma",
    auth: "authjs",
    styling: "tailwind",
  },
  entities: [
    {
      name: "Order",
      fields: [{ name: "total", type: "Int", required: true }],
      relations: [],
    },
  ],
  pages: [{ route: "/", purpose: "browse", components: ["Card"] }],
  features: ["auth"],
  theme: { preset: "clean-modern", primary: "#e23744" },
};

describe("toPlanContract", () => {
  it("serialises a plan into JSON that parses against the schema", () => {
    const plan = planBlueprint(BLUEPRINT);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const json = JSON.parse(JSON.stringify(toPlanContract(plan.value)));
    expect(PlanContractSchema.safeParse(json).success).toBe(true);
  });
});
