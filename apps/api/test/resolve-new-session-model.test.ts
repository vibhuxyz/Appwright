import { describe, expect, it } from "bun:test";
import { FIRST_USE_MODEL, resolveNewSessionModel } from "../src/session-model/resolve";

const configured = (models: readonly string[]) => (model: string) => models.includes(model);

describe("resolveNewSessionModel", () => {
  it("keeps the model the user last chatted with", () => {
    const model = resolveNewSessionModel({
      lastUsedModel: "deepseek-chat",
      defaultModel: "gemini-flash-latest",
      isConfigured: configured(["deepseek-chat", FIRST_USE_MODEL]),
    });
    expect(model).toBe("deepseek-chat");
  });

  it("starts first-time users on Claude when its key is set", () => {
    const model = resolveNewSessionModel({
      lastUsedModel: null,
      defaultModel: "gemini-flash-latest",
      isConfigured: configured([FIRST_USE_MODEL]),
    });
    expect(model).toBe(FIRST_USE_MODEL);
  });

  it("falls back to the configured default when Claude has no key", () => {
    const model = resolveNewSessionModel({
      lastUsedModel: null,
      defaultModel: "deepseek-chat",
      isConfigured: configured(["deepseek-chat"]),
    });
    expect(model).toBe("deepseek-chat");
  });

  it("ignores a last-used model whose key was removed", () => {
    const model = resolveNewSessionModel({
      lastUsedModel: "gpt-5.4-mini",
      defaultModel: "deepseek-chat",
      isConfigured: configured(["deepseek-chat"]),
    });
    expect(model).toBe("deepseek-chat");
  });
});
