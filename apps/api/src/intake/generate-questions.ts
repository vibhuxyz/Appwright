import {
  bestAvailableModel,
  OpenAiProvider,
  isAbortError,
  isProviderCreditsDepleted,
  providerFor,
  readProviderText,
  ProviderOutputTooLargeError,
  type Provider,
} from "@repo/agent-core";
import {
  buildQuestionsPrompt,
  groundedKnownNeeds,
  mergeQuestionPhrasing,
  parseGeneratedQuestions,
  selectDiscoveryQuestions,
  withoutKnownFacts,
  type IntakeQuestion,
} from "@repo/planner";
import { log } from "../log";

export const QUESTIONS_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_BYTES = 8_000;

export class IntakeQuestionsError extends Error {
  readonly code: "GENERATION_FAILED" | "TIMEOUT";

  constructor(code: "GENERATION_FAILED" | "TIMEOUT", message: string) {
    super(message);
    this.name = "IntakeQuestionsError";
    this.code = code;
  }
}

function toIntakeQuestionsError(error: unknown, model: string): IntakeQuestionsError {
  const message = error instanceof Error ? error.message : String(error);
  const creditsDepleted = isProviderCreditsDepleted(message);
  log.error("generateIntakeQuestions provider call failed", {
    model,
    provider: providerFor(model),
    providerCreditsDepleted: creditsDepleted,
    message,
  });
  return new IntakeQuestionsError(
    "GENERATION_FAILED",
    creditsDepleted
      ? "The AI service is temporarily unavailable. Your account balance is unaffected — try again shortly."
      : "Could not generate questions for this prompt",
  );
}

function asCatalogQuestions(prompt: string, answers: Readonly<Record<string, string>>): IntakeQuestion[] {
  return selectDiscoveryQuestions(prompt, answers).map((question) => ({
    need: question.need,
    text: question.text,
    label: question.label,
    options: question.options,
    defaultOptionIndex: question.defaultOptionIndex,
    inputType: question.inputType,
    importance: question.importance,
    why: question.why,
    ...(question.prefill ? { prefill: question.prefill } : {}),
  }));
}

async function phraseQuestions(
  catalog: IntakeQuestion[],
  provider: Provider,
  prompt: string,
  signal: AbortSignal,
  answers: Readonly<Record<string, string>>,
): Promise<IntakeQuestion[]> {
  try {
    const raw = await readProviderText(
      provider,
      buildQuestionsPrompt(prompt, answers, catalog),
      signal,
      MAX_OUTPUT_BYTES,
    );
    const parsed = parseGeneratedQuestions(raw);
    if (!parsed.ok) return catalog;
    const knownNeeds = groundedKnownNeeds(parsed.known, prompt);
    const answeredNeeds = new Set([...Object.keys(answers), ...knownNeeds]);
    return mergeQuestionPhrasing(withoutKnownFacts(catalog, knownNeeds), parsed.questions, answeredNeeds);
  } catch (error) {
    if (error instanceof ProviderOutputTooLargeError) return catalog;
    const timedOut = isAbortError(error) || signal.aborted;
    log.error("generateIntakeQuestions phrasing failed, using catalog", {
      model: provider.model,
      provider: providerFor(provider.model),
      timedOut,
      providerCreditsDepleted: isProviderCreditsDepleted(error instanceof Error ? error.message : String(error)),
      message: error instanceof Error ? error.message : String(error),
    });
    return catalog;
  }
}

export async function generateIntakeQuestions(
  prompt: string,
  provider?: Provider,
  signal: AbortSignal = AbortSignal.timeout(QUESTIONS_TIMEOUT_MS),
  answers: Readonly<Record<string, string>> = {},
): Promise<IntakeQuestion[]> {
  const catalog = asCatalogQuestions(prompt, answers);
  const isFirstRound = Object.keys(answers).length === 0;
  if (catalog.length === 0 && !isFirstRound) return [];
  const resolved = provider ?? new OpenAiProvider({ model: bestAvailableModel() });
  try {
    return await phraseQuestions(catalog, resolved, prompt, signal, answers);
  } catch (error) {
    if (isAbortError(error) || signal.aborted) {
      throw new IntakeQuestionsError("TIMEOUT", "Timed out while choosing questions");
    }
    throw toIntakeQuestionsError(error, resolved.model);
  }
}
