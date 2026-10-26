import { describe, expect, it } from "bun:test";
import { CREATIVE_CHOICE_NEEDS, DECIDE_FOR_ME_OPTION } from "@repo/contracts";
import { withCreativeChoiceQuestions } from "../src/intake";

const businessName = { need: "business-name", text: "What is it called?", label: "Name", options: [], defaultOptionIndex: 0 };

describe("withCreativeChoiceQuestions", () => {
  it("adds the design and images questions after the generated ones on the first round", () => {
    const needs = withCreativeChoiceQuestions([businessName], {}).map((question) => question.need);
    expect(needs).toEqual(["business-name", CREATIVE_CHOICE_NEEDS.design, CREATIVE_CHOICE_NEEDS.images]);
  });

  it("asks them even when the model wrote no questions", () => {
    expect(withCreativeChoiceQuestions([], undefined)).toHaveLength(2);
  });

  it("never asks them twice once answered", () => {
    const answers = { [CREATIVE_CHOICE_NEEDS.design]: DECIDE_FOR_ME_OPTION, [CREATIVE_CHOICE_NEEDS.images]: DECIDE_FOR_ME_OPTION };
    expect(withCreativeChoiceQuestions([businessName], answers).map((question) => question.need)).toEqual(["business-name"]);
  });
});
