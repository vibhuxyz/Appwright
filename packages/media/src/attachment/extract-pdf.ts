import { PDFParse } from "pdf-parse";
import type { ExtractedPdfPage, PdfExtractionResult } from "./types";

const DEFAULT_MAX_PAGES = 50;
const SCANNED_WORD_THRESHOLD = 20;

function extractHeadings(text: string): string[] {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const headings: string[] = [];
  for (const line of lines) {
    if (line.length < 80 && (line.startsWith("#") || /^[A-Z0-9\s:.-]{3,}$/.test(line))) {
      headings.push(line.replace(/^#+\s*/, ""));
    }
  }
  return headings.slice(0, 10);
}

function isPasswordError(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "name" in err) {
    return String((err as { name: unknown }).name).includes("Password");
  }
  return String(err).toLowerCase().includes("password");
}

export async function extractPdf(
  bytes: Uint8Array,
  options: { maxPages?: number; renderScreenshots?: boolean } = {},
): Promise<PdfExtractionResult> {
  if (bytes.length === 0) {
    return { ok: false, error: { code: "EMPTY_FILE", message: "PDF file is empty" } };
  }

  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const parser = new PDFParse({ data: bytes });

  try {
    const info = await parser.getInfo();
    if (info.total > maxPages) {
      await parser.destroy();
      return {
        ok: false,
        error: {
          code: "TOO_MANY_PAGES",
          message: `PDF has ${info.total} pages, exceeding limit of ${maxPages} pages`,
        },
      };
    }

    const textResult = await parser.getText();
    const extractedPages: ExtractedPdfPage[] = [];
    let totalWords = 0;

    for (const page of textResult.pages) {
      const trimmed = page.text.trim();
      const words = trimmed.length > 0 ? trimmed.split(/\s+/).filter(Boolean).length : 0;
      totalWords += words;
      extractedPages.push({
        pageNumber: page.num,
        text: trimmed,
        wordCount: words,
        headings: extractHeadings(trimmed),
      });
    }

    const isScanned =
      extractedPages.length > 0 && totalWords / extractedPages.length < SCANNED_WORD_THRESHOLD;
    let pageScreenshotDataUrls: string[] | undefined;

    if (isScanned && options.renderScreenshots) {
      try {
        const screenshots = await parser.getScreenshot({
          imageDataUrl: true,
          desiredWidth: 1024,
        });
        pageScreenshotDataUrls = screenshots.pages
          .map((p: { dataUrl?: string }) => p.dataUrl)
          .filter((url): url is string => typeof url === "string" && url.length > 0);
      } catch {
        pageScreenshotDataUrls = undefined;
      }
    }

    await parser.destroy();

    return {
      ok: true,
      data: {
        totalPages: info.total,
        extractedPages,
        fullText: extractedPages.map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`).join("\n\n"),
        isScanned,
        pageScreenshotDataUrls,
      },
    };
  } catch (error) {
    await parser.destroy().catch(() => {});
    if (isPasswordError(error)) {
      return {
        ok: false,
        error: { code: "PASSWORD_PROTECTED", message: "PDF is encrypted or password-protected" },
      };
    }
    return {
      ok: false,
      error: { code: "CORRUPT_PDF", message: `Failed to parse PDF: ${String(error)}` },
    };
  }
}
