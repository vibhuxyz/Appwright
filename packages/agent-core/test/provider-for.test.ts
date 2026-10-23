import { describe, expect, it } from "bun:test";
import { AVAILABLE_MODELS } from "@repo/contracts";
import { providerFor } from "../src/providers/openai";

describe("providerFor", () => {
  it("routes deepseek-chat and deepseek-reasoner to deepseek", () => {
    expect(providerFor("deepseek-chat")).toBe("deepseek");
    expect(providerFor("deepseek-reasoner")).toBe("deepseek");
  });

  it("falls back to deepseek for an unlisted deepseek-prefixed model", () => {
    expect(providerFor("deepseek-v4")).toBe("deepseek");
  });

  it("routes Claude models to anthropic", () => {
    expect(providerFor("claude-sonnet-5-5")).toBe("anthropic");
    expect(providerFor("claude-opus-5-5")).toBe("anthropic");
    expect(providerFor("claude-haiku-5-5")).toBe("anthropic");
  });

  it("falls back to anthropic for an unlisted claude-prefixed model", () => {
    expect(providerFor("claude-sonnet-4-6")).toBe("anthropic");
  });

  it("falls back to gemini for an unlisted gemini-prefixed model", () => {
    expect(providerFor("gemini-3.0-pro")).toBe("gemini");
  });

  it("still routes known openai, groq, xai and gemini models correctly", () => {
    expect(providerFor("gpt-5.4-mini")).toBe("openai");
    expect(providerFor("llama-3.3-70b-versatile")).toBe("groq");
    expect(providerFor("grok-beta")).toBe("xai");
    expect(providerFor("gemini-3.7-flash")).toBe("gemini");
  });

  it("falls back to openai for a fully unknown model", () => {
    expect(providerFor("some-new-model")).toBe("openai");
  });

  it("routes every curated picker model to its labeled provider family", () => {
    const expected: Record<string, ReturnType<typeof providerFor>> = {
      Google: "gemini",
      OpenAI: "openai",
      Anthropic: "anthropic",
      DeepSeek: "deepseek",
      Groq: "groq",
      xAI: "xai",
    };
    for (const model of AVAILABLE_MODELS) {
      const family = expected[model.provider];
      if (family === undefined) {
        throw new Error(`catalog provider ${model.provider} has no routing family`);
      }
      expect(providerFor(model.id)).toBe(family);
    }
  });
});
