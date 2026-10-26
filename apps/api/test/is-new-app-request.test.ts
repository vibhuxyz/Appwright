import { describe, expect, it } from "bun:test";
import { FakeProvider, type Provider } from "@repo/agent-core";
import { isNewAppRequest } from "../src/intake";

function throwingProvider(message: string): Provider {
  return {
    model: "fake",
    async *stream() {
      throw new Error(message);
    },
  };
}

const SIMPLE_TWEAK = JSON.stringify({
  intent: "modify",
  changeType: "style",
  risk: "low",
  route: "none",
  component: "none",
  complexity: 1,
  ambiguity: 0,
  confidence: 0.9,
});

const SIMPLE_NEW_SITE = JSON.stringify({
  intent: "create",
  changeType: "component",
  risk: "low",
  route: "frontend",
  component: "none",
  complexity: 3,
  ambiguity: 2,
  confidence: 0.85,
});

const NEW_APP = JSON.stringify({
  intent: "create",
  changeType: "component",
  risk: "medium",
  route: "frontend",
  component: "none",
  complexity: 8,
  ambiguity: 3,
  confidence: 0.85,
});

describe("isNewAppRequest", () => {
  it("skips intake questions for a classified simple tweak", async () => {
    const planned = await isNewAppRequest(
      "make the button blue",
      new FakeProvider([{ kind: "text", text: SIMPLE_TWEAK }]),
    );
    expect(planned).toBe(false);
  });

  it("asks questions for a classified new app", async () => {
    const planned = await isNewAppRequest(
      "build a bakery landing page",
      new FakeProvider([{ kind: "text", text: NEW_APP }]),
    );
    expect(planned).toBe(true);
  });

  it("asks questions for a simple one-page site too", async () => {
    const planned = await isNewAppRequest(
      "RK Home Planner landing page to show his 2D and 3D naksha work in Ranchi",
      new FakeProvider([{ kind: "text", text: SIMPLE_NEW_SITE }]),
    );
    expect(planned).toBe(true);
  });

  it("still asks questions when the classifier cannot reach the provider", async () => {
    const planned = await isNewAppRequest(
      "build landing page for my bakery business where user can see our menu services producds etc",
      throwingProvider("OpenAI request failed: 402 credits are depleted"),
    );
    expect(planned).toBe(true);
  });
});
