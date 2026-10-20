import type { Provider } from "../providers/types";
import { MAX_OUTPUT_BYTES } from "./constants";
import type { GenerationUsage } from "./types";

export type CollectedOutput =
  | { ok: true; text: string; usage?: GenerationUsage }
  | { ok: false; code: "output_too_large" | "aborted"; message: string };

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export async function collectOutput(
  provider: Provider,
  prompt: string,
  signal: AbortSignal,
): Promise<CollectedOutput> {
  const parts: string[] = [];
  let bytes = 0;
  let usage: GenerationUsage | undefined;
  try {
    for await (const chunk of provider.stream(
      [{ role: "user", type: "text", content: prompt }],
      [],
      { signal },
    )) {
      if (chunk.type === "usage") {
        usage = { inputTokens: chunk.inputTokens, outputTokens: chunk.outputTokens };
      }
      if (chunk.type !== "text_delta") continue;
      bytes += Buffer.byteLength(chunk.delta, "utf8");
      if (bytes > MAX_OUTPUT_BYTES) {
        return {
          ok: false,
          code: "output_too_large",
          message: `Model output exceeded ${MAX_OUTPUT_BYTES} bytes`,
        };
      }
      parts.push(chunk.delta);
    }
  } catch (error) {
    if (!isAbortError(error)) throw error;
    return { ok: false, code: "aborted", message: "Generation was aborted or timed out" };
  }
  return { ok: true, text: parts.join(""), usage };
}
