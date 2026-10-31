import { describe, expect, it } from "bun:test";
import { INTEGRATION_CATALOG } from "@repo/contracts";
import { integrationAgentPrompt } from "./integration-prompt";

describe("integrationAgentPrompt", () => {
  it("names the provider and asks for Appwright or own keys", () => {
    for (const entry of INTEGRATION_CATALOG) {
      const prompt = integrationAgentPrompt(entry);
      expect(prompt).toContain(entry.provider);
      expect(prompt).toContain(entry.name);
      expect(prompt).toContain("request_integration");
      expect(prompt).toContain("Appwright test key or my own key");
      expect(prompt.length).toBeLessThanOrEqual(1500);
    }
  });
});
