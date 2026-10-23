import { FakeProvider } from "@repo/agent-core";
import { describe, expect, it } from "bun:test";
import { classify, UNKNOWN_DECISION } from "../src/classify";

describe("classify", () => {
  it("parses a well-formed decision out of the model's reply", async () => {
    const provider = new FakeProvider([
      {
        kind: "text",
        text: '{"intent":"delete","changeType":"database","risk":"high","route":"database","component":"none","complexity":2,"ambiguity":1,"confidence":0.95}',
      },
    ]);

    const result = await classify("drop the users table", provider);

    expect(result).toEqual({
      status: "accepted",
      decision: {
        intent: "delete",
        changeType: "database",
        risk: "high",
        route: "database",
        component: "none",
        complexity: 2,
        ambiguity: 1,
        confidence: 0.95,
      },
    });
  });

  it("accepts a component name that's actually in the live ui-system registry", async () => {
    const provider = new FakeProvider([
      {
        kind: "text",
        text: '{"intent":"modify","changeType":"style","risk":"low","route":"none","component":"Button","complexity":1,"ambiguity":1,"confidence":0.95}',
      },
    ]);

    const result = await classify("change the button color to blue", provider);

    expect(result.status).toBe("accepted");
    expect(result.decision.component).toBe("Button");
  });

  it("falls open to status 'invalid' when the model names a component outside the live registry", async () => {
    const provider = new FakeProvider([
      {
        kind: "text",
        text: '{"intent":"modify","changeType":"style","risk":"low","route":"none","component":"Accordion","complexity":1,"ambiguity":1,"confidence":0.95}',
      },
    ]);

    const result = await classify("change the accordion color to blue", provider);

    expect(result).toEqual({ status: "invalid", decision: UNKNOWN_DECISION });
  });

  it("returns status 'low_confidence' when the model itself scores below 0.5, keeping the parsed decision", async () => {
    const provider = new FakeProvider([
      {
        kind: "text",
        text: '{"intent":"modify","changeType":"style","risk":"low","route":"none","component":"none","complexity":1,"ambiguity":6,"confidence":0.2}',
      },
    ]);

    const result = await classify("do something vague", provider);

    expect(result).toEqual({
      status: "low_confidence",
      decision: {
        intent: "modify",
        changeType: "style",
        risk: "low",
        route: "none",
        component: "none",
        complexity: 1,
        ambiguity: 6,
        confidence: 0.2,
      },
    });
  });

  it("falls open to status 'invalid' when the reply isn't JSON", async () => {
    const provider = new FakeProvider([
      { kind: "text", text: "sure, I can help with that!" },
    ]);

    const result = await classify("do something", provider);

    expect(result).toEqual({ status: "invalid", decision: UNKNOWN_DECISION });
  });

  it("falls open to status 'invalid' when the reply is JSON but doesn't match the schema", async () => {
    const provider = new FakeProvider([
      { kind: "text", text: '{"intent":"fly_to_the_moon"}' },
    ]);

    const result = await classify("do something", provider);

    expect(result).toEqual({ status: "invalid", decision: UNKNOWN_DECISION });
  });

  it("falls open to status 'provider_error' when the model call itself throws", async () => {
    const provider = new FakeProvider([]); // no scripted turns — stream() throws immediately

    const result = await classify("do something", provider);

    expect(result).toEqual({
      status: "provider_error",
      decision: UNKNOWN_DECISION,
      errorMessage: "FakeProvider: script exhausted",
    });
  });
});
