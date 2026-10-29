import { describe, expect, it } from "bun:test";
import { ANALYZE_PROMPT_VERSION, hashPrompt, type PromptAnalysis } from "@repo/contracts";
import { freshStoredAnalysis } from "../src/worker/stored-analysis";

const PROMPT = "TypeError: x is undefined";

async function analysisFor(prompt: string, overrides: Partial<PromptAnalysis> = {}): Promise<PromptAnalysis> {
  return {
    intent: "debug",
    confidence: 0.9,
    complexity: 2,
    ambiguity: 1,
    needsQuestions: false,
    suggestedPath: "send-direct",
    extractedHints: { files: [], errorLines: [], mentionedFeatures: [] },
    source: "model",
    promptHash: await hashPrompt(prompt),
    promptVersion: ANALYZE_PROMPT_VERSION,
    ...overrides,
  };
}

const userRow = { role: "user", content: PROMPT, data: null };

describe("freshStoredAnalysis", () => {
  it("returns an analysis made for this exact prompt", async () => {
    const analysis = await analysisFor(PROMPT);
    expect(await freshStoredAnalysis(analysis, [userRow])).toEqual(analysis);
  });

  it("rejects an analysis made for different text", async () => {
    expect(await freshStoredAnalysis(await analysisFor("something else"), [userRow])).toBeUndefined();
  });

  it("rejects an analysis from an older prompt version", async () => {
    expect(await freshStoredAnalysis(await analysisFor(PROMPT, { promptVersion: "analyze@0" }), [userRow])).toBeUndefined();
  });

  it("rejects an analysis once the user asked to change the plan", async () => {
    const feedbackRow = { role: "user", content: "Plan approved.", data: { intake: true, planFeedback: ["add a blog"] } };
    expect(await freshStoredAnalysis(await analysisFor(PROMPT), [userRow, feedbackRow])).toBeUndefined();
  });

  it("ignores a stored value that is not an analysis", async () => {
    expect(await freshStoredAnalysis({ intent: "create" }, [userRow])).toBeUndefined();
    expect(await freshStoredAnalysis(null, [userRow])).toBeUndefined();
  });
});
