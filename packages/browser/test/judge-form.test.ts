import { describe, expect, it } from "bun:test";
import { valueFor } from "../src/interact/form-values";
import { judgeSubmission } from "../src/interact/judge-form";
import { chooseClickTargets, MAX_CLICKS_PER_PAGE } from "../src/interact/safe-click";
import type { FieldDescriptor, InteractionOutcome, ObservedEvents } from "../src/session";

const QUIET_EVENTS: ObservedEvents = { consoleErrors: [], pageErrors: [], failedRequests: [], badResponses: [] };
const NOTHING: InteractionOutcome = { urlChanged: false, newText: [], invalidFields: [], dialogShown: false, requests: [] };

function field(overrides: Partial<FieldDescriptor>): FieldDescriptor {
  return { index: 0, kind: "text", name: "", label: "", required: false, min: null, max: null, ...overrides };
}

function judge(scenario: "empty" | "invalid-email" | "valid", outcome: Partial<InteractionOutcome>, events = QUIET_EVENTS) {
  return judgeSubmission({ scenario, formLabel: "Contact", outcome: { ...NOTHING, ...outcome }, events }).map((p) => p.kind);
}

describe("judgeSubmission", () => {
  it("accepts a blocked empty submission", () => {
    expect(judge("empty", { invalidFields: [{ label: "Email", message: "Please fill out this field" }] })).toEqual([]);
  });

  it("flags an empty submission that saved data", () => {
    expect(judge("empty", { requests: [{ method: "POST", path: "/api/x", status: 200 }] })).toEqual(["form-accepts-empty"]);
  });

  it("does not treat a rejected save as accepted", () => {
    expect(judge("empty", { requests: [{ method: "POST", path: "/api/x", status: 422 }] })).toEqual([]);
  });

  it("flags an invalid email that was accepted", () => {
    expect(judge("invalid-email", { urlChanged: true })).toEqual(["form-accepts-invalid"]);
  });

  it("flags a server error and an uncaught error as separate problems", () => {
    const kinds = judge(
      "valid",
      { requests: [{ method: "POST", path: "/api/x", status: 503 }] },
      { ...QUIET_EVENTS, pageErrors: ["boom"] },
    );
    expect(kinds).toEqual(["form-server-error", "interaction-error"]);
  });

  it("flags a valid submission that gave no feedback", () => {
    expect(judge("valid", {})).toEqual(["form-no-response"]);
  });

  it("accepts any visible feedback after a valid submission", () => {
    expect(judge("valid", { newText: ["Thanks!"] })).toEqual([]);
    expect(judge("valid", { dialogShown: true })).toEqual([]);
  });

  it("cannot judge a valid submission that the form's own validation rejected", () => {
    expect(judge("valid", { invalidFields: [{ label: "Password", message: "Too short" }] })).toEqual([]);
  });
});

describe("valueFor", () => {
  it("uses an invalid email only for the invalid-email scenario", () => {
    expect(valueFor(field({ kind: "email" }), "invalid-email")).toBe("not-an-email");
    expect(valueFor(field({ kind: "email" }), "valid")).toBe("qa.tester@example.test");
  });

  it("picks text from the field name or label", () => {
    expect(valueFor(field({ name: "first_name" }), "valid")).toBe("Test");
    expect(valueFor(field({ label: "Full name" }), "valid")).toBe("Test User");
    expect(valueFor(field({ kind: "textarea", label: "Message" }), "valid")).toContain("automated test message");
  });

  it("keeps numbers inside min and max", () => {
    expect(valueFor(field({ kind: "number", min: 5, max: 10 }), "valid")).toBe("5");
    expect(valueFor(field({ kind: "number", min: 0, max: 0 }), "valid")).toBe("0");
  });
});

describe("chooseClickTargets", () => {
  it("never picks destructive or costly buttons", () => {
    const names = ["Delete account", "Sign out", "Pay now", "Place order", "Show details", "Open menu"];
    const chosen = chooseClickTargets(names.map((name, index) => ({ index, name })));
    expect(chosen.map((target) => target.name)).toEqual(["Show details", "Open menu"]);
  });

  it("skips duplicate names and caps the count", () => {
    const targets = Array.from({ length: 20 }, (_, index) => ({ index, name: `Tab ${index % 12}` }));
    const chosen = chooseClickTargets(targets);
    expect(new Set(chosen.map((target) => target.name)).size).toBe(chosen.length);
    expect(chosen.length).toBeLessThanOrEqual(MAX_CLICKS_PER_PAGE);
  });
});
