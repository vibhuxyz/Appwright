import { isAbortError, providerFor, readProviderText, type Provider } from "@repo/agent-core";
import type { ThemeOptionsRequest, ThemeOptionsResponse } from "@repo/contracts";
import { buildThemesPrompt, mergeThemes, parseGeneratedThemes, presetThemes } from "@repo/planner";
import { log } from "../log";

export const THEME_OPTIONS_TIMEOUT_MS = 35_000;
const MAX_OUTPUT_BYTES = 24_000;

function businessText(request: ThemeOptionsRequest): string {
  const answers = Object.values(request.answers ?? {}).filter((value) => value !== "skip");
  return [request.prompt, ...answers].join(" ");
}

export async function generateThemeOptions(
  request: ThemeOptionsRequest,
  provider: Provider,
  signal: AbortSignal = AbortSignal.timeout(THEME_OPTIONS_TIMEOUT_MS),
): Promise<ThemeOptionsResponse> {
  const presets = presetThemes({
    text: businessText(request),
    description: request.description,
    referenceColors: request.referenceColors,
  });
  try {
    const raw = await readProviderText(
      provider,
      buildThemesPrompt({
        prompt: request.prompt,
        answers: request.answers,
        questions: request.questions,
        description: request.description,
        referenceColors: request.referenceColors,
        plan: request.plan,
      }),
      signal,
      MAX_OUTPUT_BYTES,
    );
    const generated = parseGeneratedThemes(raw);
    if (generated.length === 0) return { themes: presets, source: "preset" };
    return { themes: mergeThemes(generated, presets), source: "ai" };
  } catch (error) {
    if (isAbortError(error) || !(error instanceof Error)) throw error;
    log.error("generateThemeOptions fell back to presets", {
      model: provider.model,
      provider: providerFor(provider.model),
      message: error.message,
    });
    return { themes: presets, source: "preset" };
  }
}
