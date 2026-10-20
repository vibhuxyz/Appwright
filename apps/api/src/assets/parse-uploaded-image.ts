import busboy from "busboy";
import type { Request } from "express";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export type ParseUploadedImageResult =
  | { readonly ok: true; readonly bytes: Uint8Array; readonly mimeType: string }
  | { readonly ok: false; readonly code: "MISSING_FILE" | "INVALID_TYPE" | "TOO_LARGE" };

export function parseUploadedImage(req: Request): Promise<ParseUploadedImageResult> {
  return new Promise((resolve) => {
    const parser = busboy({ headers: req.headers, limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });
    let settled = false;

    const settle = (result: ParseUploadedImageResult): void => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    parser.on("file", (_fieldName, file, info) => {
      if (!ALLOWED_MIME_TYPES.has(info.mimeType)) {
        file.resume();
        settle({ ok: false, code: "INVALID_TYPE" });
        return;
      }

      const chunks: Buffer[] = [];
      let tooLarge = false;

      file.on("data", (chunk: Buffer) => chunks.push(chunk));
      file.on("limit", () => {
        tooLarge = true;
      });
      file.on("close", () => {
        if (tooLarge) {
          settle({ ok: false, code: "TOO_LARGE" });
          return;
        }
        settle({ ok: true, bytes: Buffer.concat(chunks), mimeType: info.mimeType });
      });
    });

    parser.on("finish", () => settle({ ok: false, code: "MISSING_FILE" }));
    parser.on("error", () => settle({ ok: false, code: "MISSING_FILE" }));

    req.pipe(parser);
  });
}
