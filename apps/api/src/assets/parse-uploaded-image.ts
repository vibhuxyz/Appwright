import busboy from "busboy";
import type { Request } from "express";
import { sniffImageMime } from "@repo/media";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg"]);

export type ParseUploadedImageResult =
  | { readonly ok: true; readonly bytes: Uint8Array; readonly mimeType: string }
  | { readonly ok: false; readonly code: "MISSING_FILE" | "INVALID_TYPE" | "TOO_LARGE" };

export function parseUploadedImage(req: Request): Promise<ParseUploadedImageResult> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (result: ParseUploadedImageResult): void => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    let parser: ReturnType<typeof busboy>;
    try {
      parser = busboy({ headers: req.headers, limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });
    } catch {
      settle({ ok: false, code: "MISSING_FILE" });
      return;
    }

    let sawFile = false;

    parser.on("file", (_fieldName, file) => {
      sawFile = true;
      const chunks: Buffer[] = [];
      let tooLarge = false;

      file.on("data", (chunk: Buffer) => chunks.push(chunk));
      file.on("limit", () => {
        tooLarge = true;
      });
      file.on("error", () => settle({ ok: false, code: "MISSING_FILE" }));
      file.on("end", () => {
        if (tooLarge) {
          settle({ ok: false, code: "TOO_LARGE" });
          return;
        }
        const bytes = Buffer.concat(chunks);
        const sniffed = sniffImageMime(bytes);
        if (!sniffed || !ALLOWED_MIME_TYPES.has(sniffed)) {
          settle({ ok: false, code: "INVALID_TYPE" });
          return;
        }
        settle({ ok: true, bytes, mimeType: sniffed });
      });
    });

    parser.on("finish", () => {
      if (!sawFile) settle({ ok: false, code: "MISSING_FILE" });
    });
    parser.on("error", () => settle({ ok: false, code: "MISSING_FILE" }));

    req.pipe(parser);
  });
}
