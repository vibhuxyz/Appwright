import {
  ProjectSpecificationSchema,
  type Attachment,
  type ProjectSpecification,
} from "@repo/contracts";
import { OpenAiProvider, supportsVision } from "../providers/openai";
import type { Message } from "../types";
import type { Provider } from "../providers/types";
import { extractJsonFromReply } from "./parse-json";
import { buildMultimodalAnalysisPrompt } from "./synthesize-intent";
import type { MultimodalAnalysisInput, MultimodalAnalysisResult } from "./types";

const ANALYSIS_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_BYTES = 200_000;
const VISION_FALLBACK_MODEL = "gemini-3.7-flash";

function resolveVisionModel(
  requestedModel: string,
  attachments: readonly Attachment[] = [],
): string {
  const hasImages = attachments.some((a) => a.type === "image");
  if (!hasImages) return requestedModel;
  if (supportsVision(requestedModel)) return requestedModel;
  return VISION_FALLBACK_MODEL;
}

async function collectStreamText(
  provider: Provider,
  messages: Message[],
  signal: AbortSignal,
): Promise<string> {
  const parts: string[] = [];
  let bytes = 0;
  for await (const chunk of provider.stream(messages, [], { signal })) {
    if (chunk.type === "text_delta") {
      bytes += Buffer.byteLength(chunk.delta, "utf8");
      if (bytes > MAX_OUTPUT_BYTES) throw new Error("Output exceeded max bytes");
      parts.push(chunk.delta);
    }
  }
  return parts.join("");
}

export async function analyzeMultimodalPrompt(
  input: MultimodalAnalysisInput,
  customProvider?: Provider,
): Promise<MultimodalAnalysisResult> {
  const attachments = input.attachments ?? [];
  const modelToUse = resolveVisionModel(input.model ?? "gpt-5.4-mini", attachments);
  const provider = customProvider ?? new OpenAiProvider({ model: modelToUse });

  const promptContent = buildMultimodalAnalysisPrompt(input.prompt, attachments);
  const messages: Message[] = [
    {
      role: "user",
      type: "text",
      content: promptContent,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    },
  ];

  const signal = input.signal ?? AbortSignal.timeout(ANALYSIS_TIMEOUT_MS);

  try {
    const rawReply = await collectStreamText(provider, messages, signal);
    const parsed = extractJsonFromReply(rawReply);
    if (!parsed) {
      return {
        ok: false,
        error: {
          code: "INVALID_SPECIFICATION",
          message: "Could not extract valid JSON from multimodal analysis response",
          details: rawReply.slice(0, 500),
        },
      };
    }

    const validated = ProjectSpecificationSchema.safeParse(parsed);
    if (!validated.success) {
      return {
        ok: false,
        error: {
          code: "INVALID_SPECIFICATION",
          message: `ProjectSpecification validation failed: ${validated.error.message}`,
          details: validated.error.issues,
        },
      };
    }

    return { ok: true, specification: validated.data as ProjectSpecification };
  } catch (err: unknown) {
    if (signal.aborted) {
      return {
        ok: false,
        error: {
          code: "TIMEOUT",
          message: "Multimodal analysis timed out",
          details: String(err),
        },
      };
    }
    return {
      ok: false,
      error: {
        code: "ANALYSIS_FAILED",
        message: `Multimodal analysis failed: ${String(err)}`,
        details: err,
      },
    };
  }
}
