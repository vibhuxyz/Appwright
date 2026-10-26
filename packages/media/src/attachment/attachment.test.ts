import { describe, expect, it } from "bun:test";
import { extractPdf } from "./extract-pdf";
import { parsePngDimensions, processImageAttachment } from "./process-image";
import { sniffAttachmentMime } from "./sniff-attachment";

describe("sniffAttachmentMime", () => {
  it("detects PNG from magic bytes", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = sniffAttachmentMime(png);
    expect(result).toEqual({ mimeType: "image/png", type: "image", extension: "png" });
  });

  it("detects JPEG from magic bytes", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const result = sniffAttachmentMime(jpeg);
    expect(result).toEqual({ mimeType: "image/jpeg", type: "image", extension: "jpg" });
  });

  it("detects WebP from RIFF and WEBP markers", () => {
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    const result = sniffAttachmentMime(webp);
    expect(result).toEqual({ mimeType: "image/webp", type: "image", extension: "webp" });
  });

  it("detects PDF from %PDF magic bytes", () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    const result = sniffAttachmentMime(pdf);
    expect(result).toEqual({ mimeType: "application/pdf", type: "pdf", extension: "pdf" });
  });

  it("detects SVG XML text", () => {
    const svg = new TextEncoder().encode("<svg viewBox='0 0 100 100'></svg>");
    const result = sniffAttachmentMime(svg);
    expect(result).toEqual({ mimeType: "image/svg+xml", type: "image", extension: "svg" });
  });

  it("returns null for unsupported format", () => {
    const random = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    const result = sniffAttachmentMime(random);
    expect(result).toBeNull();
  });
});

describe("processImageAttachment", () => {
  it("rejects empty image bytes", () => {
    const empty = new Uint8Array([]);
    const res = processImageAttachment(empty);
    expect(res.ok).toBe(false);
  });

  it("processes PNG bytes and parses dimensions", () => {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    const view = new DataView(bytes.buffer);
    view.setUint32(16, 800, false);
    view.setUint32(20, 600, false);

    const dims = parsePngDimensions(bytes);
    expect(dims).toEqual({ width: 800, height: 600 });

    const res = processImageAttachment(bytes);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.mimeType).toBe("image/png");
      expect(res.data.width).toBe(800);
      expect(res.data.height).toBe(600);
      expect(res.data.dataUrl).toStartWith("data:image/png;base64,");
    }
  });
});

describe("extractPdf", () => {
  it("fails fast with EMPTY_FILE for empty buffer", async () => {
    const res = await extractPdf(new Uint8Array([]));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("EMPTY_FILE");
    }
  });

  it("returns CORRUPT_PDF for invalid PDF bytes", async () => {
    const corrupt = new TextEncoder().encode("%PDF-not-a-valid-document");
    const res = await extractPdf(corrupt);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("CORRUPT_PDF");
    }
  });
});
