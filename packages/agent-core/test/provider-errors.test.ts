import { describe, expect, it } from "bun:test";
import {
  classifyProviderFailure,
  isProviderCreditsDepleted,
  isRetryableProviderFailure,
} from "../src/providers/provider-errors";

describe("isProviderCreditsDepleted", () => {
  it("recognizes Gemini's RESOURCE_EXHAUSTED status", () => {
    expect(
      isProviderCreditsDepleted(
        'OpenAI request failed: 429 [{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}]',
      ),
    ).toBe(true);
  });

  it("recognizes OpenAI's insufficient_quota wording on a 429", () => {
    expect(
      isProviderCreditsDepleted(
        'OpenAI request failed: 429 {"error":{"message":"You exceeded your current quota, please check your plan and billing details.","type":"insufficient_quota"}}',
      ),
    ).toBe(true);
  });

  it("recognizes DeepSeek's insufficient balance wording on a 402", () => {
    expect(
      isProviderCreditsDepleted(
        'OpenAI request failed: 402 {"error":{"message":"Insufficient Balance"}}',
      ),
    ).toBe(true);
  });

  it("recognizes Anthropic's low credit balance wording", () => {
    expect(
      isProviderCreditsDepleted(
        'OpenAI request failed: 400 {"error":{"message":"Your credit balance is too low to access the Anthropic API."}}',
      ),
    ).toBe(true);
  });

  it("does not flag an unrelated provider error", () => {
    expect(isProviderCreditsDepleted("OpenAI request failed: 500 internal error")).toBe(false);
  });
});

describe("classifyProviderFailure", () => {
  it("treats rate limits and 5xx as retryable", () => {
    expect(classifyProviderFailure("OpenAI request failed: 429 rate limit")).toBe("transient");
    expect(classifyProviderFailure("OpenAI request failed: 503 unavailable")).toBe("transient");
    expect(isRetryableProviderFailure("transient")).toBe(true);
  });

  it("treats billing, auth, and invalid output as non-retryable", () => {
    expect(classifyProviderFailure("OpenAI request failed: 402 Insufficient Balance")).toBe("credits");
    expect(classifyProviderFailure("OpenAI request failed: 401 invalid api key")).toBe("auth");
    expect(classifyProviderFailure("output_unparseable")).toBe("invalid");
    expect(isRetryableProviderFailure("credits")).toBe(false);
    expect(isRetryableProviderFailure("auth")).toBe(false);
    expect(isRetryableProviderFailure("invalid")).toBe(false);
  });

  it("does not retry a generic explosion as if it were a planning failure", () => {
    expect(classifyProviderFailure("provider exploded")).toBe("unknown");
    expect(isRetryableProviderFailure("unknown")).toBe(false);
  });
});
