import type { Provider } from "@repo/agent-core";

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

export async function readProviderText(
  provider: Provider,
  prompt: string,
  signal: AbortSignal,
  maxBytes: number,
): Promise<string> {
  const parts: string[] = [];
  let bytes = 0;
  for await (const chunk of provider.stream(
    [{ role: "user", type: "text", content: prompt }],
    [],
    { signal },
  )) {
    if (chunk.type !== "text_delta") continue;
    bytes += Buffer.byteLength(chunk.delta, "utf8");
    if (bytes > maxBytes) throw new ProviderOutputTooLargeError(maxBytes);
    parts.push(chunk.delta);
  }
  return parts.join("");
}
