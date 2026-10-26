import { sniffAttachmentMime } from "./sniff-attachment";

export interface ProcessedImageResult {
  width?: number;
  height?: number;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
}

export function parsePngDimensions(
  bytes: Uint8Array,
): { width: number; height: number } | undefined {
  if (bytes.length < 24) return undefined;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  return width > 0 && height > 0 ? { width, height } : undefined;
}

export function processImageAttachment(
  bytes: Uint8Array,
  fallbackMime?: string,
): { ok: true; data: ProcessedImageResult } | { ok: false; error: string } {
  if (bytes.length === 0) {
    return { ok: false, error: "Image file is empty" };
  }

  const sniffed = sniffAttachmentMime(bytes);
  const mimeType = sniffed?.mimeType ?? fallbackMime ?? "image/png";
  if (sniffed && sniffed.type !== "image") {
    return { ok: false, error: `Invalid image MIME type: ${sniffed.mimeType}` };
  }

  const dims = mimeType === "image/png" ? parsePngDimensions(bytes) : undefined;
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return {
    ok: true,
    data: {
      width: dims?.width,
      height: dims?.height,
      mimeType,
      sizeBytes: bytes.length,
      dataUrl,
    },
  };
}
