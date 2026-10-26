import { z } from "zod";

export const MAX_ATTACHMENTS_PER_MESSAGE = 10;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENT_BYTES = MAX_IMAGE_BYTES;
export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_TOTAL_ATTACHMENT_BYTES = 50 * 1024 * 1024;
export const MAX_PDF_PAGES = 50;

export const AttachmentTypeSchema = z.enum(["image", "pdf", "document"]);
export const AttachmentStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const AttachmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  type: AttachmentTypeSchema,
  sizeBytes: z.number().int().nonnegative(),
  dataUrl: z.string().optional(),
  url: z.string().optional(),
  storageKey: z.string().optional(),
  status: AttachmentStatusSchema.default("COMPLETED"),
  pageCount: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  extractedText: z.string().optional(),
  description: z.string().max(1000).optional(),
  errorMessage: z.string().optional(),
});

export const ImageAttachmentSchema = AttachmentSchema;
