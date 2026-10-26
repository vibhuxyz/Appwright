import type {
  AttachmentStatus,
  AttachmentType,
} from "@repo/contracts";

export interface CreateAttachmentRecordInput {
  projectId: string;
  sessionId: string;
  messageId?: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  type: AttachmentType;
  metadata?: Record<string, unknown>;
  extractedText?: string;
}

export interface UpdateAttachmentRecordInput {
  status: AttachmentStatus;
  metadata?: Record<string, unknown>;
  extractedText?: string;
  analysis?: Record<string, unknown>;
  errorMessage?: string;
}
