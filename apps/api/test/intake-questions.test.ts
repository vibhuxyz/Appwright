import { describe, expect, it } from "bun:test";
import { FakeProvider } from "@repo/agent-core";
import { generateIntakeQuestions, IntakeQuestionsError } from "../src/intake";

const TODO_JSON = JSON.stringify({
  questions: [
    {
      need: "sharing",
      text: "Should people share lists with others?",
      label: "Sharing",
      options: ["Just me", "Share with others"],
      defaultOptionIndex: 0,
    },
    {
      need: "due-dates",
      text: "Do tasks need due dates?",
      label: "Due dates",
      options: ["No due dates", "Due dates on tasks"],
      defaultOptionIndex: 1,
    },
  ],
});

describe("generateIntakeQuestions", () => {
  it("returns the product questions the model wrote", async () => {
    const questions = await generateIntakeQuestions(
      "build todo app",
      new FakeProvider([{ kind: "text", text: TODO_JSON }]),
    );
    expect(questions.map((question) => question.need)).toEqual(["sharing", "due-dates"]);
    expect(questions[0]?.text).toContain("share lists");
  });

  it("returns nothing when the model has nothing to ask", async () => {
    const questions = await generateIntakeQuestions(
      "make the button blue",
      new FakeProvider([{ kind: "text", text: `{"questions":[]}` }]),
    );
    expect(questions).toEqual([]);
  });

  it("fails closed when the model does not return questions JSON", async () => {
    await expect(
      generateIntakeQuestions(
        "build todo app",
        new FakeProvider([{ kind: "text", text: "I am not sure" }]),
      ),
    ).rejects.toMatchObject({
      name: "IntakeQuestionsError",
      code: "GENERATION_FAILED",
    } satisfies Partial<IntakeQuestionsError>);
  });
});
