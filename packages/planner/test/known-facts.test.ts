import { describe, expect, it } from "bun:test";
import { groundedKnownNeeds, withoutKnownFacts, type IntakeQuestion } from "../src";

const PROMPT = "build landing page for my 100x school busines, we run the super 30 bootcamp";

const businessName: IntakeQuestion = {
  need: "business-name",
  text: "What is the business called?",
  label: "Business name",
  options: [],
  defaultOptionIndex: 0,
  inputType: "short-text",
  importance: "required",
};

const contacts: IntakeQuestion = { ...businessName, need: "business-contacts", inputType: "contacts" };

describe("groundedKnownNeeds", () => {
  it("keeps a fact that appears in the request, ignoring case and spacing", () => {
    expect([...groundedKnownNeeds({ "business-name": "100x  School" }, PROMPT)]).toEqual(["business-name"]);
  });

  it("rejects a fact the request never mentions or one that is too short", () => {
    expect(groundedKnownNeeds({ "business-name": "Acme Labs", other: "sc" }, PROMPT).size).toBe(0);
  });
});

describe("withoutKnownFacts", () => {
  it("drops only short-text questions the request already answered", () => {
    const known = new Set(["business-name", "business-contacts"]);
    expect(withoutKnownFacts([businessName, contacts], known).map((question) => question.need)).toEqual([
      "business-contacts",
    ]);
  });
});
