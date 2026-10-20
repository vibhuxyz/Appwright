import { describe, expect, test } from "bun:test";
import { createCapabilityRegistry, loadCapabilityConfig } from "../src/capability";

describe("capability registry", () => {
  test("uses defaults when env is empty", () => {
    const registry = createCapabilityRegistry(loadCapabilityConfig({}));
    const resolution = registry.resolve("strong_coding");
    expect(resolution.model).toBe("gpt-5.2-codex");
    expect(resolution.fallbackModel).toBe("gpt-5.4-mini");
  });

  test("env overrides model and fallback, blank values are ignored", () => {
    const registry = createCapabilityRegistry(
      loadCapabilityConfig({
        CAPABILITY_MODEL_CHEAP: " gemini-flash-latest ",
        CAPABILITY_MODEL_FAST_CODING: "   ",
        CAPABILITY_FALLBACK_MODEL: "gpt-4o-mini",
      }),
    );
    expect(registry.resolve("cheap").model).toBe("gemini-flash-latest");
    expect(registry.resolve("fast_coding").model).toBe("gpt-5.4-mini");
    expect(registry.resolve("cheap").fallbackModel).toBe("gpt-4o-mini");
  });
});
