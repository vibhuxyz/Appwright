import { describe, expect, it } from "bun:test";
import { FakeProvider, type Provider } from "@repo/agent-core";
import { shouldPlanInDetail } from "../src/intake";

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

describe("shouldPlanInDetail", () => {
  it("skips intake questions for a classified simple tweak", async () => {
    const planned = await shouldPlanInDetail(
      "make the button blue",
      new FakeProvider([{ kind: "text", text: SIMPLE_TWEAK }]),
    );
    expect(planned).toBe(false);
  });

  it("asks questions for a classified new app", async () => {
    const planned = await shouldPlanInDetail(
      "build a bakery landing page",
      new FakeProvider([{ kind: "text", text: NEW_APP }]),
    );
    expect(planned).toBe(true);
  });

  it("still asks questions when the classifier cannot reach the provider", async () => {
    const planned = await shouldPlanInDetail(
      "build landing page for my bakery business where user can see our menu services producds etc",
      throwingProvider("OpenAI request failed: 402 credits are depleted"),
    );
    expect(planned).toBe(true);
  });
});
