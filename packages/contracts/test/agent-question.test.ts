import { describe, expect, it } from "bun:test";
import { AskUserArgsSchema, RequestIntegrationArgsSchema } from "../src";

const paymentQuestion = {
  label: "Payment Purpose",
  text: "What should customers pay for?",
  options: ["Consultation booking fee", "Advance payment", "Custom amount"],
  defaultOptionIndex: 0,
  inputType: "multiple",
};

describe("AskUserArgsSchema", () => {
  it("accepts up to four questions with two to four options", () => {
    expect(AskUserArgsSchema.safeParse({ questions: [paymentQuestion] }).success).toBe(true);
    expect(AskUserArgsSchema.safeParse({ questions: Array(5).fill(paymentQuestion) }).success).toBe(false);
  });

  it("rejects a default option that does not exist", () => {
    expect(AskUserArgsSchema.safeParse({ questions: [{ ...paymentQuestion, defaultOptionIndex: 3 }] }).success).toBe(false);
  });

  it("rejects single-option and oversized questions", () => {
    expect(AskUserArgsSchema.safeParse({ questions: [{ ...paymentQuestion, options: ["Only"] }] }).success).toBe(false);
    expect(AskUserArgsSchema.safeParse({ questions: [{ ...paymentQuestion, text: "x".repeat(281) }] }).success).toBe(false);
  });
});

describe("RequestIntegrationArgsSchema", () => {
  it("only accepts providers the dock can configure", () => {
    expect(RequestIntegrationArgsSchema.safeParse({ provider: "razorpay", reason: "Take payments" }).success).toBe(true);
    expect(RequestIntegrationArgsSchema.safeParse({ provider: "realtime", reason: "Live updates" }).success).toBe(false);
  });
});
