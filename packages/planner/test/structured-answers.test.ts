import { describe, expect, it } from "bun:test";
import { answersByNeed } from "@repo/contracts";
import { extractFacts, requirementTurns, structuredAnswers, type IntakeQuestion } from "../src";

const ORDERING: IntakeQuestion = {
  need: "ordering-mode",
  text: "How do customers order?",
  label: "Ordering",
  options: ["Browse only", "Order online"],
  defaultOptionIndex: 0,
};

const NOTES: IntakeQuestion = {
  need: "notes",
  text: "Anything else?",
  label: "Notes",
  options: [],
  defaultOptionIndex: 0,
  inputType: "short-text",
};

describe("structuredAnswers", () => {
  it("records user answers, defaults for skipped questions, and skips with no default", () => {
    expect(structuredAnswers({ "ordering-mode": "Order online", notes: "skip" }, [ORDERING, NOTES])).toEqual([
      { need: "ordering-mode", answer: "Order online", source: "user" },
      { need: "notes", answer: "", source: "skip" },
    ]);
    expect(structuredAnswers({}, [ORDERING])).toEqual([{ need: "ordering-mode", answer: "Browse only", source: "default" }]);
  });

  it("returns nothing when there were no answers", () => {
    expect(structuredAnswers(undefined, [ORDERING])).toEqual([]);
  });

  it("is stored on the reply turn next to the text transcript", () => {
    const reply = requirementTurns({ "ordering-mode": "Order online" }, [ORDERING]).at(-1);
    expect(reply?.role).toBe("user");
    expect(reply?.data).toMatchObject({ answers: [{ need: "ordering-mode", answer: "Order online", source: "user" }] });
  });

  it("feeds the planner an explicit answer instead of a guess from the prompt", () => {
    const answers = answersByNeed(structuredAnswers({ "ordering-mode": "Order online" }, [ORDERING]));
    expect(extractFacts("a bakery website", answers).answered["ordering-mode"]).toBe("Order online");
    expect(answers).toEqual({ "ordering-mode": "Order online" });
  });
});
