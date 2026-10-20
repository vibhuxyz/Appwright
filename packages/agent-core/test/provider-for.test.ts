import { describe, expect, it } from "bun:test";
import { providerFor } from "../src/providers/openai";

describe("providerFor", () => {
  it("routes deepseek-chat and deepseek-reasoner to deepseek", () => {
    expect(providerFor("deepseek-chat")).toBe("deepseek");
    expect(providerFor("deepseek-reasoner")).toBe("deepseek");
  });

  it("falls back to deepseek for an unlisted deepseek-prefixed model", () => {
    expect(providerFor("deepseek-v4")).toBe("deepseek");
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
});
