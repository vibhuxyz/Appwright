import { describe, expect, it } from "bun:test";
import { bestAvailableModel, bestAvailableModels } from "../src/providers/best-available-model";
import { DEFAULT_MODEL } from "../src/providers/openai";

describe("bestAvailableModel", () => {
  it("picks a frontier model when only its provider's key is set", () => {
    expect(bestAvailableModel({ DEEPSEEK_API_KEY: "x" })).toBe("deepseek-reasoner");
  });

  it("prefers frontier over standard and efficient when several providers are configured", () => {
    expect(
      bestAvailableModel({ GEMINI_API_KEY: "x", DEEPSEEK_API_KEY: "x" }),
    ).toBe("deepseek-reasoner");
  });

  it("degrades to a standard model when the only configured provider has no frontier entry", () => {
    expect(bestAvailableModel({ GEMINI_API_KEY: "x" })).toBe("gemini-3.1-pro-preview");
  });

  it("falls back to DEFAULT_MODEL when no provider key is configured", () => {
    expect(bestAvailableModel({})).toBe(DEFAULT_MODEL);
  });

  it("prefers openai's frontier model when both openai and anthropic keys are set", () => {
    expect(
      bestAvailableModel({ OPENAI_API_KEY: "x", ANTHROPIC_API_KEY: "x" }),
    ).toBe("gpt-5.4");
  });

  it("lists every reachable model so scaffold can fall back in order", () => {
    const models = bestAvailableModels({ OPENAI_API_KEY: "x", DEEPSEEK_API_KEY: "x" });
    expect(models[0]).toBe("gpt-5.4");
    expect(models).toContain("deepseek-reasoner");
    expect(models.length).toBeGreaterThan(1);
  });
});
