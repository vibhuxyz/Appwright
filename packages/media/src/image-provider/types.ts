export interface GenerateImageInput {
  readonly prompt: string;
  readonly signal: AbortSignal;
}

export interface GeneratedImage {
  readonly bytes: Uint8Array;
  readonly mimeType: string;
}

export type ImageGenerationErrorCode = "PROVIDER_TIMEOUT" | "PROVIDER_REFUSED" | "PROVIDER_ERROR";

export interface ImageGenerationError {
  readonly code: ImageGenerationErrorCode;
  readonly message: string;
}

export type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export interface ImageProvider {
  readonly name: string;
  generate(input: GenerateImageInput): Promise<Result<GeneratedImage, ImageGenerationError>>;
}
