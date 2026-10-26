import type { z } from "zod";
import type {
  AttachmentSchema,
  AttachmentStatusSchema,
  AttachmentTypeSchema,
} from "./attachment.schema";

export type AttachmentType = z.infer<typeof AttachmentTypeSchema>;
export type AttachmentStatus = z.infer<typeof AttachmentStatusSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
export type ImageAttachment = Attachment;
