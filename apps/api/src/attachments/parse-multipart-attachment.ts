import busboy from "busboy";
import type { Request } from "express";
import { sniffAttachmentMime } from "@repo/media";

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

export type ParseMultipartResult =
  | {
      ok: true;
      file: {
        bytes: Uint8Array;
        filename: string;
        mimeType: string;
        type: "image" | "pdf" | "document";
        extension: string;
      };
    }
  | {
      ok: false;
      code: "MISSING_FILE" | "UNSUPPORTED_TYPE" | "TOO_LARGE";
      message: string;
    };

export function parseMultipartAttachment(req: Request): Promise<ParseMultipartResult> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (result: ParseMultipartResult): void => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    let parser: ReturnType<typeof busboy>;
    try {
      parser = busboy({
        headers: req.headers,
        limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1 },
      });
    } catch {
      settle({ ok: false, code: "MISSING_FILE", message: "Invalid multipart form data" });
      return;
    }

    let sawFile = false;

    parser.on("file", (_fieldName, file, info) => {
      sawFile = true;
      const chunks: Buffer[] = [];
      let tooLarge = false;

      file.on("data", (chunk: Buffer) => chunks.push(chunk));
      file.on("limit", () => {
        tooLarge = true;
      });
      file.on("error", () =>
        settle({ ok: false, code: "MISSING_FILE", message: "Failed reading uploaded file stream" }),
      );
      file.on("end", () => {
        if (tooLarge) {
          settle({
            ok: false,
            code: "TOO_LARGE",
            message: `Attachment exceeds maximum size of ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB`,
          });
          return;
        }
        const bytes = Buffer.concat(chunks);
        const sniffed = sniffAttachmentMime(bytes);
        if (!sniffed) {
          settle({
            ok: false,
            code: "UNSUPPORTED_TYPE",
            message: "Unsupported file format. Supported: PNG, JPEG, WebP, GIF, SVG, PDF",
          });
          return;
        }

        const safeFilename = (info.filename || `upload.${sniffed.extension}`)
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .slice(0, 100);

        settle({
          ok: true,
          file: {
            bytes,
            filename: safeFilename,
            mimeType: sniffed.mimeType,
            type: sniffed.type,
            extension: sniffed.extension,
          },
        });
      });
    });

    parser.on("finish", () => {
      if (!sawFile) {
        settle({ ok: false, code: "MISSING_FILE", message: "No file was uploaded in request" });
      }
    });

    parser.on("error", () => {
      settle({ ok: false, code: "MISSING_FILE", message: "Failed parsing form data" });
    });

    req.pipe(parser);
  });
}
