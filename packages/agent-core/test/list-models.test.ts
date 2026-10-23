import { describe, expect, it } from "bun:test";
import { AVAILABLE_MODELS } from "@repo/contracts";
import { listAvailableModels } from "../src/providers/list-models";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("listAvailableModels", () => {
  it("returns the curated catalog when no provider keys are set", async () => {
    const models = await listAvailableModels({ env: {}, fetch: async () => jsonResponse({}) });
    expect(models.map((m) => m.id)).toEqual(AVAILABLE_MODELS.map((m) => m.id));
    expect(models.some((m) => m.provider === "Google")).toBe(true);
    expect(models.some((m) => m.provider === "OpenAI")).toBe(true);
    expect(models.some((m) => m.provider === "DeepSeek")).toBe(true);
    expect(models.some((m) => m.provider === "Anthropic")).toBe(true);
  });

  it("does not call a provider that has no API key", async () => {
    const called: string[] = [];
    await listAvailableModels({
      env: { OPENAI_API_KEY: "sk-test" },
      fetch: async (input) => {
        called.push(String(input));
        return jsonResponse({ data: [{ id: "gpt-4o-mini" }] });
      },
    });
    expect(called).toHaveLength(1);
    expect(called[0]).toContain("api.openai.com");
  });

  it("appends live chat models that are not already in the catalog", async () => {
    const models = await listAvailableModels({
      env: {
        OPENAI_API_KEY: "sk-test",
        ANTHROPIC_API_KEY: "sk-ant-test",
      },
      fetch: async (input) => {
        const url = String(input);
        if (url.includes("api.openai.com")) {
          return jsonResponse({
            data: [
              { id: "gpt-4o-mini" },
              { id: "gpt-4.1" },
              { id: "whisper-1" },
              { id: "text-embedding-3-large" },
            ],
          });
        }
        if (url.includes("api.anthropic.com")) {
          return jsonResponse({
            data: [
              { id: "claude-sonnet-5-5", display_name: "Claude Sonnet 5.5" },
              { id: "claude-opus-4-6", display_name: "Claude Opus 4.6" },
            ],
          });
        }
        return jsonResponse({ error: "unexpected" }, 500);
      },
    });
    const ids = models.map((m) => m.id);
    expect(ids).toContain("gpt-4o-mini");
    expect(ids).toContain("gpt-4.1");
    expect(ids).toContain("claude-opus-4-6");
    expect(ids.filter((id) => id === "gpt-4o-mini")).toHaveLength(1);
    expect(ids).not.toContain("whisper-1");
    expect(ids).not.toContain("text-embedding-3-large");
    const extra = models.find((m) => m.id === "claude-opus-4-6");
    expect(extra?.name).toBe("Claude Opus 4.6");
    expect(extra?.provider).toBe("Anthropic");
    expect(extra?.category).toBe("frontier");
    expect(models.find((m) => m.id === "gpt-4.1")?.category).toBe("standard");
  });

  it("keeps the catalog when a provider list call fails", async () => {
    const models = await listAvailableModels({
      env: { GEMINI_API_KEY: "gem-test" },
      fetch: async () => {
        throw new Error("network down");
      },
    });
    expect(models.map((m) => m.id)).toEqual(AVAILABLE_MODELS.map((m) => m.id));
  });
});
