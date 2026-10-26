export interface AttachmentSniffResult {
  mimeType: string;
  type: "image" | "pdf" | "document";
  extension: string;
}

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
  wordCount: number;
  headings: string[];
}

export interface ExtractedPdfResult {
  totalPages: number;
  extractedPages: ExtractedPdfPage[];
  fullText: string;
  isScanned: boolean;
  pageScreenshotDataUrls?: string[];
}

export type PdfExtractionResult =
  | { ok: true; data: ExtractedPdfResult }
  | {
      ok: false;
      error: {
        code:
          | "EMPTY_FILE"
          | "CORRUPT_PDF"
          | "PASSWORD_PROTECTED"
          | "TOO_MANY_PAGES"
          | "EXTRACTION_FAILED";
        message: string;
      };
    };
