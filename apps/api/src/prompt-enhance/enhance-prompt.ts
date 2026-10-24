import {
  bestAvailableModel,
  isAbortError,
  isProviderCreditsDepleted,
  OpenAiProvider,
  ProviderOutputTooLargeError,
  providerFor,
  readProviderText,
  type Provider,
} from "@repo/agent-core";
import { log } from "../log";
import { buildEnhancePrompt } from "./build-enhance-prompt";
import { ENHANCE_PROMPT_VERSION, MAX_ENHANCED_OUTPUT_BYTES } from "./constants";

export type EnhancePromptResult =
  | { readonly ok: true; readonly enhancedPrompt: string }
  | {
      readonly ok: false;
      readonly reason: "aborted" | "too_long" | "failed";
      readonly message: string;
    };

function failureFor(
  error: unknown,
  signal: AbortSignal,
  model: string,
): EnhancePromptResult {
  if (signal.aborted || isAbortError(error)) {
    return {
      ok: false,
      reason: "aborted",
      message: "Prompt enhancement was stopped",
    };
  }
  if (error instanceof ProviderOutputTooLargeError) {
    return {
      ok: false,
      reason: "too_long",
      message: "The enhanced prompt came back too long. Try again.",
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  const creditsDepleted = isProviderCreditsDepleted(message);
  log.error("prompt enhancement failed", {
    model,
    provider: providerFor(model),
    promptVersion: ENHANCE_PROMPT_VERSION,
    providerCreditsDepleted: creditsDepleted,
    message,
  });
  return {
    ok: false,
    reason: "failed",
    message: creditsDepleted
      ? "The AI service is temporarily unavailable. Try again shortly."
      : "Could not enhance this prompt",
  };
}

export async function enhancePrompt(
  prompt: string,
  signal: AbortSignal,
  provider?: Provider,
): Promise<EnhancePromptResult> {
  const startedAt = performance.now();
  const model = provider?.model ?? bestAvailableModel();
  try {
    const raw = await readProviderText(
      provider ?? new OpenAiProvider({ model }),
      buildEnhancePrompt(prompt),
      signal,
      MAX_ENHANCED_OUTPUT_BYTES,
    );
    const enhancedPrompt = raw.trim() || prompt;
    log.info("prompt enhanced", {
      model,
      promptVersion: ENHANCE_PROMPT_VERSION,
      outputBytes: Buffer.byteLength(enhancedPrompt, "utf8"),
      ms: Math.round(performance.now() - startedAt),
    });
    return { ok: true, enhancedPrompt };
  } catch (error) {
    return failureFor(error, signal, model);
  }
}
