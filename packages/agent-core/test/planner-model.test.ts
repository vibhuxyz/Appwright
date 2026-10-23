import { describe, expect, it } from "bun:test";
import { plannerModel } from "../src/providers/model-for-plan";
import { providerFor } from "../src/providers/openai";

describe("plannerModel", () => {
  it("uses PLANNER_MODEL for planning and questions when it is set", () => {
    expect(plannerModel("FREE", { PLANNER_MODEL: "deepseek-v4-pro" })).toBe("deepseek-v4-pro");
    expect(providerFor("deepseek-v4-pro")).toBe("deepseek");
  });

  it("falls back to the best available model when PLANNER_MODEL is empty", () => {
    expect(plannerModel("FREE", { PLANNER_MODEL: "  " })).not.toBe("");
  });
});
