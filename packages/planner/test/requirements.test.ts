import { describe, expect, it } from "bun:test";
import {
  applyAnswers,
  decideArchitecture,
  detectNeeds,
  selectQuestions,
} from "../src";

describe("requirements", () => {
  const needs = detectNeeds("Build me a food delivery app with checkout");

  it("marks explicit mentions with high confidence", () => {
    expect(needs.payments.source).toBe("explicit");
    expect(needs.payments.required).toBe(true);
  });

  it("infers needs from domain words with low confidence", () => {
    expect(needs.realtime.source).toBe("inferred");
    expect(needs.realtime.confidence).toBeLessThan(0.7);
  });

  it("asks only about low-confidence needs", () => {
    const questions = selectQuestions(needs);
    expect(questions.length).toBeGreaterThan(0);
    for (const question of questions) {
      expect(needs[question.need].confidence).toBeLessThan(0.7);
    }
  });

  it("asks nothing when everything is explicit or default", () => {
    expect(selectQuestions(detectNeeds("a static page"))).toEqual([]);
  });

  it("answers override inference", () => {
    const answered = applyAnswers(needs, { realtime: false });
    expect(answered.realtime.required).toBe(false);
    expect(answered.realtime.source).toBe("explicit");
    expect(needs.realtime.required).toBe(true);
  });
});

describe("architecture", () => {
  it("applies deterministic rules and freezes the result", () => {
    const architecture = decideArchitecture(detectNeeds("chat app with payments"));
    const choices = architecture.decisions.map((d) => d.choice);
    expect(choices).toContain("websockets");
    expect(choices).toContain("razorpay");
    expect(architecture.stack.framework).toBe("next");
    expect(Object.isFrozen(architecture)).toBe(true);
    expect(Object.isFrozen(architecture.decisions)).toBe(true);
  });

  it("is deterministic", () => {
    const needs = detectNeeds("blog with search");
    expect(decideArchitecture(needs)).toEqual(decideArchitecture(needs));
  });
});
