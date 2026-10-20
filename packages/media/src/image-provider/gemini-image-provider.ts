import { z } from "zod";
import type { GenerateImageInput, GeneratedImage, ImageGenerationError, ImageProvider, Result } from "./types";

const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`;

const GeminiPartSchema = z.object({
  inlineData: z.object({ mimeType: z.string(), data: z.string() }).optional(),
});

const GeminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({ parts: z.array(GeminiPartSchema).default([]) }).optional(),
      }),
    )
    .default([]),
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function extractInlineImage(body: unknown): { data: string; mimeType: string } | null {
  const parsed = GeminiResponseSchema.safeParse(body);
  if (!parsed.success) return null;
  for (const candidate of parsed.data.candidates) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData) return part.inlineData;
    }
  }
  return null;
}

async function generate(
  input: GenerateImageInput,
): Promise<Result<GeneratedImage, ImageGenerationError>> {
  const apiKey = requireEnv("GEMINI_API_KEY");

  let response: Response;
  try {
    response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: input.prompt }] }] }),
      signal: input.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, error: { code: "PROVIDER_TIMEOUT", message: "Gemini request timed out" } };
    }
    return {
      ok: false,
      error: { code: "PROVIDER_ERROR", message: error instanceof Error ? error.message : "Gemini request failed" },
    };
  }

  if (!response.ok) {
    return { ok: false, error: { code: "PROVIDER_ERROR", message: `Gemini returned ${response.status}` } };
  }

  const inlineImage = extractInlineImage(await response.json());
  if (!inlineImage) {
    return { ok: false, error: { code: "PROVIDER_REFUSED", message: "Gemini did not return an image" } };
  }

  return {
    ok: true,
    value: { bytes: Buffer.from(inlineImage.data, "base64"), mimeType: inlineImage.mimeType },
  };
}

export const geminiImageProvider: ImageProvider = { name: "gemini", generate };
