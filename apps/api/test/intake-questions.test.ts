import { describe, expect, it } from "bun:test";
import { FakeProvider } from "@repo/agent-core";
import { PromptQuestionsResponse } from "@repo/contracts";
import { generateIntakeQuestions } from "../src/intake";

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
  it("returns catalog questions with the model's phrasing when needs match", async () => {
    const questions = await generateIntakeQuestions(
      "build todo app",
      new FakeProvider([{ kind: "text", text: TODO_JSON }]),
    );
    expect(questions.map((question) => question.need)).toEqual(
      expect.arrayContaining(["sharing", "due-dates"]),
    );
    expect(questions.find((question) => question.need === "sharing")?.text).toContain("share lists");
  });

  it("returns nothing for a small visual edit", async () => {
    const questions = await generateIntakeQuestions(
      "make the button blue",
      new FakeProvider([{ kind: "text", text: `{"questions":[]}` }]),
    );
    expect(questions).toEqual([]);
  });

  it("falls back to the catalog when the model does not return questions JSON", async () => {
    const questions = await generateIntakeQuestions(
      "build todo app",
      new FakeProvider([{ kind: "text", text: "I am not sure" }]),
    );
    expect(questions.map((question) => question.need)).toEqual(
      expect.arrayContaining(["sharing", "due-dates"]),
    );
  });

  it("falls back to the catalog when the model host returns 402", async () => {
    const questions = await generateIntakeQuestions("build a bakery landing page", {
      model: "fake",
      async *stream() {
        throw new Error(
          'OpenAI request failed: 402 [{"error":{"code":402,"status":"RESOURCE_EXHAUSTED"}}]',
        );
      },
    });
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.some((question) => question.need === "ordering-mode")).toBe(true);
  });

  it("falls back to the catalog instead of failing when the model times out", async () => {
    const questions = await generateIntakeQuestions(
      "build todo app",
      {
        model: "fake",
        async *stream() {
          await new Promise((resolve) => setTimeout(resolve, 50));
          yield { type: "text_delta", delta: TODO_JSON } as const;
        },
      },
      AbortSignal.timeout(1),
    );
    expect(questions.map((question) => question.need)).toEqual(
      expect.arrayContaining(["sharing", "due-dates"]),
    );
  });

  it("does not re-ask a decision already answered in a previous round", async () => {
    const questions = await generateIntakeQuestions(
      "Build a bakery where customers can place standard pickup orders.",
      new FakeProvider([{ kind: "text", text: `{"questions":[]}` }]),
      AbortSignal.timeout(1_000),
      { "payment-method": "Pay at pickup" },
    );
    expect(questions.map((question) => question.need)).not.toContain("payment-method");
  });

  it("does not re-ask a business name the prompt already gave", async () => {
    const questions = await generateIntakeQuestions(
      "build full stack app for my bakery business where user can come see the product , menu store deatiles and everything my business name is vibhuBakery wallah",
      new FakeProvider([{ kind: "text", text: `{"questions":[]}` }]),
    );
    expect(questions.map((question) => question.need)).not.toContain("business-name");
    expect(questions.map((question) => question.need)).toEqual(
      expect.arrayContaining(["business-contacts", "ordering-mode"]),
    );
    const contacts = questions.find((question) => question.need === "business-contacts");
    expect(contacts?.inputType).toBe("contacts");
    expect(contacts?.text.toLowerCase()).not.toContain("paste");
    expect(contacts?.options).toEqual(
      expect.arrayContaining(["Instagram", "Phone", "WhatsApp", "Email", "Support"]),
    );
  });

  it("returns required business identity fields that the API response schema accepts", async () => {
    const questions = await generateIntakeQuestions(
      "build full stack app for my bakery business",
      new FakeProvider([{ kind: "text", text: `{"questions":[]}` }]),
    );
    expect(questions[0]).toMatchObject({
      need: "business-name",
      inputType: "short-text",
      importance: "required",
    });
    expect(questions.map((question) => question.need)).not.toContain("section-images");
    const parsed = PromptQuestionsResponse.safeParse({ questions });
    expect(parsed.success).toBe(true);
  });

  it("finishes intake without image uploads so the plan and theme can come first", async () => {
    const prompt = "Build a bakery where customers can place standard pickup orders.";
    const answers: Record<string, string> = {};
    let last = await generateIntakeQuestions(
      prompt,
      new FakeProvider([{ kind: "text", text: `{"questions":[]}` }]),
      AbortSignal.timeout(1_000),
      answers,
    );
    for (let round = 0; round < 6 && last.length > 0; round++) {
      for (const question of last) {
        answers[question.need] =
          question.inputType === "short-text" || question.inputType === "contacts"
            ? `answer-for-${question.need}`
            : (question.options[0] ?? "yes");
      }
      last = await generateIntakeQuestions(
        prompt,
        new FakeProvider([{ kind: "text", text: `{"questions":[]}` }]),
        AbortSignal.timeout(1_000),
        answers,
      );
    }
    expect(last).toEqual([]);
    expect(Object.keys(answers)).not.toContain("section-images");
  });
});
