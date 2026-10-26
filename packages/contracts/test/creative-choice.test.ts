import { describe, expect, it } from "bun:test";
import {
  CHOOSE_MYSELF_OPTION,
  CREATIVE_CHOICE_NEEDS,
  CREATIVE_CHOICE_QUESTIONS,
  DECIDE_FOR_ME_OPTION,
  PromptQuestionSchema,
  hasCreativeChoice,
  isDecideForMe,
} from "../src";

describe("creative choice", () => {
  it("asks design and images as valid single-choice questions defaulting to decide for me", () => {
    expect(CREATIVE_CHOICE_QUESTIONS.map((question) => question.need)).toEqual([
      CREATIVE_CHOICE_NEEDS.design,
      CREATIVE_CHOICE_NEEDS.images,
    ]);
    for (const question of CREATIVE_CHOICE_QUESTIONS) {
      expect(PromptQuestionSchema.safeParse(question).success).toBe(true);
      expect(question.options[question.defaultOptionIndex]).toBe(DECIDE_FOR_ME_OPTION);
    }
  });

  it("treats decide for me and a skipped answer as decide, everything else as choose", () => {
    const need = CREATIVE_CHOICE_NEEDS.images;
    expect(isDecideForMe({ [need]: DECIDE_FOR_ME_OPTION }, need)).toBe(true);
    expect(isDecideForMe({ [need]: "skip" }, need)).toBe(true);
    expect(isDecideForMe({ [need]: CHOOSE_MYSELF_OPTION }, need)).toBe(false);
    expect(isDecideForMe({}, need)).toBe(false);
    expect(isDecideForMe(undefined, need)).toBe(false);
  });

  it("knows when the choice was already asked", () => {
    expect(hasCreativeChoice({ [CREATIVE_CHOICE_NEEDS.design]: CHOOSE_MYSELF_OPTION }, CREATIVE_CHOICE_NEEDS.design)).toBe(true);
    expect(hasCreativeChoice({ other: "x" }, CREATIVE_CHOICE_NEEDS.design)).toBe(false);
  });
});
