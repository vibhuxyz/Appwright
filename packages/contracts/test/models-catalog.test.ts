import { describe, expect, test } from "bun:test";
import {
  AVAILABLE_MODELS,
  MODEL_CATEGORIES,
  inferModelCategory,
  modelCategory,
  modelsForCategory,
} from "../src/models.catalog";

describe("model catalog categories", () => {
  test("every curated model has an explicit category", () => {
    for (const model of AVAILABLE_MODELS) {
      if (model.category === undefined) {
        throw new Error(`missing category for ${model.id}`);
      }
      expect(modelCategory(model)).toBe(model.category);
    }
  });

  test("inferModelCategory matches the curated category for each catalog id", () => {
    for (const model of AVAILABLE_MODELS) {
      expect(inferModelCategory(model.id)).toBe(modelCategory(model));
    }
  });

  test("120b is frontier so it is not classified as 20b efficient", () => {
    expect(inferModelCategory("openai/gpt-oss-120b")).toBe("frontier");
    expect(inferModelCategory("openai/gpt-oss-20b")).toBe("efficient");
  });

  test("live extras inherit a category from the id", () => {
    expect(inferModelCategory("claude-opus-4-6")).toBe("frontier");
    expect(inferModelCategory("gpt-4.1")).toBe("standard");
    expect(inferModelCategory("gpt-5.4-mini")).toBe("efficient");
    expect(inferModelCategory("gemini-3.1-pro-preview")).toBe("standard");
  });
});

describe("modelsForCategory", () => {
  test("tab order is Frontier, Standard, Efficient", () => {
    expect([...MODEL_CATEGORIES]).toEqual(["frontier", "standard", "efficient"]);
  });

  test("returns only models in the requested tab", () => {
    const efficient = modelsForCategory(AVAILABLE_MODELS, "efficient");
    const standard = modelsForCategory(AVAILABLE_MODELS, "standard");
    const frontier = modelsForCategory(AVAILABLE_MODELS, "frontier");
    expect(efficient.every((model) => modelCategory(model) === "efficient")).toBe(true);
    expect(standard.every((model) => modelCategory(model) === "standard")).toBe(true);
    expect(frontier.every((model) => modelCategory(model) === "frontier")).toBe(true);
    expect(efficient.length + standard.length + frontier.length).toBe(AVAILABLE_MODELS.length);
  });

  test("keeps Gemini Flash on Efficient and GPT-5.4 on Frontier", () => {
    expect(modelsForCategory(AVAILABLE_MODELS, "efficient").some((m) => m.id === "gemini-3.7-flash")).toBe(
      true,
    );
    expect(modelsForCategory(AVAILABLE_MODELS, "frontier").some((m) => m.id === "gpt-5.4")).toBe(true);
    expect(modelsForCategory(AVAILABLE_MODELS, "efficient").some((m) => m.id === "gpt-5.4")).toBe(false);
  });
});
