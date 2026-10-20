import { describe, expect, it } from "bun:test";
import { FakeProvider } from "@repo/agent-core";
import { generateDesignDirections } from "@repo/planner";
import { buildBlueprint, BuildBlueprintError } from "../src";

const INTENT_JSON = JSON.stringify({ type: "new-app", domain: "food-delivery", complexity: "complex" });
const CONTENT_JSON = JSON.stringify({
  entities: [
    { name: "Restaurant", fields: [{ name: "name", type: "String", required: true, unique: false }] },
  ],
  pages: [{ route: "/restaurants", purpose: "Browse restaurants", components: [] }],
  features: ["auth"],
  theme: { preset: "default", primary: "#111827" },
});

describe("buildBlueprint", () => {
  it("classifies intent, generates content, and plans a valid task DAG", async () => {
    const plan = await buildBlueprint("build me a food delivery app", {
      provider: new FakeProvider([
        { kind: "text", text: INTENT_JSON },
        { kind: "text", text: CONTENT_JSON },
      ]),
    });
    expect(plan.blueprint.intent).toEqual({ type: "new-app", domain: "food-delivery", complexity: "complex" });
    expect(plan.blueprint.entities.map((e) => e.name)).toEqual(["Restaurant"]);
    expect(plan.blueprint.features).toEqual(["auth"]);
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.tasks.some((t) => t.type === "auth")).toBe(true);
    expect(plan.graph.dependsOn.size).toBe(plan.tasks.length);
  });

  it("fails with INTENT_FAILED when the model returns unclassifiable intent", async () => {
    await expect(
      buildBlueprint("build me a food delivery app", {
        provider: new FakeProvider([{ kind: "text", text: "not json" }]),
      }),
    ).rejects.toMatchObject({ name: "BuildBlueprintError", code: "INTENT_FAILED" } satisfies Partial<BuildBlueprintError>);
  });

  it("fails with CONTENT_FAILED when content generation returns no usable pages", async () => {
    await expect(
      buildBlueprint("build me a food delivery app", {
        provider: new FakeProvider([
          { kind: "text", text: INTENT_JSON },
          { kind: "text", text: JSON.stringify({ pages: [] }) },
        ]),
      }),
    ).rejects.toMatchObject({ name: "BuildBlueprintError", code: "CONTENT_FAILED" } satisfies Partial<BuildBlueprintError>);
  });

  it("uses the chosen design direction's design and layout blocks", async () => {
    const [, nonDefault] = generateDesignDirections("");
    if (!nonDefault) throw new Error("expected a second design direction");

    const plan = await buildBlueprint("build me a food delivery app", {
      directionId: nonDefault.id,
      provider: new FakeProvider([
        { kind: "text", text: INTENT_JSON },
        { kind: "text", text: CONTENT_JSON },
      ]),
    });
    expect(plan.blueprint.design).toEqual(nonDefault.design);
    expect(plan.blueprint.layout).toEqual(nonDefault.layout);
  });

  it("falls back to the default direction for an unknown directionId", async () => {
    const defaultDirection = generateDesignDirections("").find((d) => d.isDefault);
    if (!defaultDirection) throw new Error("expected a default design direction");

    const plan = await buildBlueprint("build me a food delivery app", {
      directionId: "not-a-real-direction",
      provider: new FakeProvider([
        { kind: "text", text: INTENT_JSON },
        { kind: "text", text: CONTENT_JSON },
      ]),
    });
    expect(plan.blueprint.design).toEqual(defaultDirection.design);
  });
});
