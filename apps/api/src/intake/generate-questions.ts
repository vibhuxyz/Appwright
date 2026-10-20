import { DEFAULT_MODEL, OpenAiProvider, type Provider } from "@repo/agent-core";
import {
  buildQuestionsPrompt,
  parseGeneratedQuestions,
  type IntakeQuestion,
} from "@repo/planner";
import { isAbortError, readProviderText, ProviderOutputTooLargeError } from "../llm";

export const QUESTIONS_TIMEOUT_MS = 15_000;
const MAX_OUTPUT_BYTES = 8_000;

export class IntakeQuestionsError extends Error {
  readonly code: "GENERATION_FAILED" | "TIMEOUT";

  constructor(code: "GENERATION_FAILED" | "TIMEOUT", message: string) {
    super(message);
    this.name = "IntakeQuestionsError";
    this.code = code;
  }
}

export async function generateIntakeQuestions(
  prompt: string,
  provider?: Provider,
  signal: AbortSignal = AbortSignal.timeout(QUESTIONS_TIMEOUT_MS),
): Promise<IntakeQuestion[]> {
  try {
    const resolved = provider ?? new OpenAiProvider({ model: DEFAULT_MODEL });
    const raw = await readProviderText(resolved, buildQuestionsPrompt(prompt), signal, MAX_OUTPUT_BYTES);
    const parsed = parseGeneratedQuestions(raw);
    if (!parsed.ok) {
      throw new IntakeQuestionsError(
        "GENERATION_FAILED",
        "Could not generate questions for this prompt",
      );
    }
    return parsed.questions;
  } catch (error) {
    if (error instanceof IntakeQuestionsError) throw error;
    if (error instanceof ProviderOutputTooLargeError) {
      throw new IntakeQuestionsError(
        "GENERATION_FAILED",
        "Could not generate questions for this prompt",
      );
    }
    if (isAbortError(error) || signal.aborted) {
      throw new IntakeQuestionsError(
        "TIMEOUT",
        "Timed out while choosing questions",
      );
    }
    throw new IntakeQuestionsError(
      "GENERATION_FAILED",
      "Could not generate questions for this prompt",
    );
  }
}
