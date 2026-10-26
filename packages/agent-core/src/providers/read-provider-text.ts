import type { Provider } from "./types";

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

export class ProviderOutputTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Provider output exceeded ${maxBytes} bytes`);
    this.name = "ProviderOutputTooLargeError";
  }
}

export async function readProviderTextWithProgress(input: {
  provider: Provider;
  prompt: string;
  signal: AbortSignal;
  maxBytes: number;
  onText?: (textSoFar: string) => void;
}): Promise<string> {
  const parts: string[] = [];
  let bytes = 0;
  for await (const chunk of input.provider.stream(
    [{ role: "user", type: "text", content: input.prompt }],
    [],
    { signal: input.signal },
  )) {
    if (chunk.type !== "text_delta") continue;
    bytes += Buffer.byteLength(chunk.delta, "utf8");
    if (bytes > input.maxBytes) throw new ProviderOutputTooLargeError(input.maxBytes);
    parts.push(chunk.delta);
    input.onText?.(parts.join(""));
  }
  return parts.join("");
}

export function readProviderText(
  provider: Provider,
  prompt: string,
  signal: AbortSignal,
  maxBytes: number,
): Promise<string> {
  return readProviderTextWithProgress({ provider, prompt, signal, maxBytes });
}
