import { geminiImageProvider } from "./gemini-image-provider";
import type { ImageProvider } from "./types";

export type ImageProviderName = "gemini";

const PROVIDERS: Readonly<Record<ImageProviderName, ImageProvider>> = {
  gemini: geminiImageProvider,
};

function isImageProviderName(value: string): value is ImageProviderName {
  return value in PROVIDERS;
}

export function imageProviderFor(name?: string): ImageProvider {
  const key = name ?? process.env.IMAGE_PROVIDER ?? "gemini";
  return isImageProviderName(key) ? PROVIDERS[key] : geminiImageProvider;
}
