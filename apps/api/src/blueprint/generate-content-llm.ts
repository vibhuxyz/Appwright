import { DEFAULT_MODEL, OpenAiProvider, type Provider } from "@repo/agent-core";
import {
  buildContentPrompt,
  parseGeneratedContent,
  type BlueprintContent,
} from "@repo/planner";
import { readProviderText } from "../llm";

const MAX_OUTPUT_BYTES = 8_000;

export class BlueprintContentError extends Error {
  readonly reason: "invalid_json" | "invalid_shape" | "no_pages";

  constructor(reason: "invalid_json" | "invalid_shape" | "no_pages") {
    super(`Could not generate app content: ${reason}`);
    this.name = "BlueprintContentError";
    this.reason = reason;
  }
}

export async function generateBlueprintContent(
  prompt: string,
  signal: AbortSignal,
  provider?: Provider,
): Promise<BlueprintContent> {
  const resolved = provider ?? new OpenAiProvider({ model: DEFAULT_MODEL });
  const raw = await readProviderText(resolved, buildContentPrompt(prompt), signal, MAX_OUTPUT_BYTES);
  const parsed = parseGeneratedContent(raw);
  if (!parsed.ok) throw new BlueprintContentError(parsed.reason);
  return parsed.content;
}
