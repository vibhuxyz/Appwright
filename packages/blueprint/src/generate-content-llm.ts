import { bestAvailableModel, OpenAiProvider, readProviderTextWithProgress, type Provider } from "@repo/agent-core";
import type { ProjectSpecification } from "@repo/contracts";
import {
  buildContentPrompt,
  extractPartialPages,
  parseGeneratedContent,
  type BlueprintContent,
  type PartialPage,
} from "@repo/planner";
import { specificationToBlueprintContent } from "./spec-to-content";

const MAX_OUTPUT_BYTES = 8_000;

export class BlueprintContentError extends Error {
  readonly reason: "invalid_json" | "invalid_shape" | "no_pages";

  constructor(reason: "invalid_json" | "invalid_shape" | "no_pages") {
    super(`Could not generate app content: ${reason}`);
    this.name = "BlueprintContentError";
    this.reason = reason;
  }
}

function pagesSignature(pages: readonly PartialPage[]): string {
  return pages.map((page) => `${page.route}:${page.components.length}`).join("|");
}

function partialPagesReporter(onPages: ((pages: readonly PartialPage[]) => void) | undefined) {
  if (!onPages) return undefined;
  const last = { signature: "" };
  return (text: string) => {
    const pages = extractPartialPages(text);
    const signature = pagesSignature(pages);
    if (pages.length === 0 || signature === last.signature) return;
    last.signature = signature;
    onPages(pages);
  };
}

export async function generateBlueprintContent(input: {
  prompt: string;
  signal: AbortSignal;
  provider?: Provider;
  specification?: ProjectSpecification;
  onPages?: (pages: readonly PartialPage[]) => void;
}): Promise<BlueprintContent> {
  if (input.specification && input.specification.pages.length > 0) {
    return specificationToBlueprintContent(input.specification);
  }
  const raw = await readProviderTextWithProgress({
    provider: input.provider ?? new OpenAiProvider({ model: bestAvailableModel() }),
    prompt: buildContentPrompt(input.prompt),
    signal: input.signal,
    maxBytes: MAX_OUTPUT_BYTES,
    onText: partialPagesReporter(input.onPages),
  });
  const parsed = parseGeneratedContent(raw);
  if (!parsed.ok) throw new BlueprintContentError(parsed.reason);
  return parsed.content;
}
