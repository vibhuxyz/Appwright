import type { AttachmentSniffResult } from "./types";

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const JPEG_MAGIC = [0xff, 0xd8];
const GIF_MAGIC = [0x47, 0x49, 0x46];
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46];

function hasPrefix(bytes: Uint8Array, magic: readonly number[]): boolean {
  if (bytes.length < magic.length) return false;
  return magic.every((value, index) => bytes[index] === value);
}

function isWebP(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

function isSvg(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  const head = new TextDecoder().decode(bytes.slice(0, 200)).trim().toLowerCase();
  return head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"));
}

export function sniffAttachmentMime(
  bytes: Uint8Array,
): AttachmentSniffResult | null {
  if (hasPrefix(bytes, PNG_MAGIC)) {
    return { mimeType: "image/png", type: "image", extension: "png" };
  }
  if (hasPrefix(bytes, JPEG_MAGIC)) {
    return { mimeType: "image/jpeg", type: "image", extension: "jpg" };
  }
  if (hasPrefix(bytes, GIF_MAGIC)) {
    return { mimeType: "image/gif", type: "image", extension: "gif" };
  }
  if (isWebP(bytes)) {
    return { mimeType: "image/webp", type: "image", extension: "webp" };
  }
  if (hasPrefix(bytes, PDF_MAGIC)) {
    return { mimeType: "application/pdf", type: "pdf", extension: "pdf" };
  }
  if (isSvg(bytes)) {
    return { mimeType: "image/svg+xml", type: "image", extension: "svg" };
  }
  return null;
}
