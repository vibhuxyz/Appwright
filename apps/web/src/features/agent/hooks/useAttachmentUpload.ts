import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  type Attachment,
} from "@repo/contracts";
import { useCallback, useState } from "react";
import { agentApi } from "../api/agentApi";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
]);

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return `Unsupported file type: ${file.type || file.name}. Allowed: PNG, JPEG, WebP, GIF, SVG, PDF.`;
  }
  const isPdf = file.type === "application/pdf";
  const limit = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    const limitMb = Math.round(limit / (1024 * 1024));
    return `File ${file.name} is too large. Limit is ${limitMb}MB.`;
  }
  return null;
}

export function useAttachmentUpload(projectId: string, sessionId?: string) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      if (attachments.length + fileArray.length > MAX_ATTACHMENTS_PER_MESSAGE) {
        setUploadError(`Maximum ${MAX_ATTACHMENTS_PER_MESSAGE} attachments allowed.`);
        return;
      }

      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          setUploadError(error);
          return;
        }
      }

      setUploadError(null);
      setIsUploading(true);

      try {
        const uploaded = await Promise.all(
          fileArray.map((file) => agentApi.uploadAttachment(projectId, file, sessionId)),
        );
        setAttachments((prev) => [...prev, ...uploaded]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to upload file";
        setUploadError(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [attachments.length, projectId, sessionId],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    setUploadError(null);
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
    setUploadError(null);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        void uploadFiles(files);
      }
    },
    [uploadFiles],
  );

  return {
    attachments,
    isUploading,
    uploadError,
    uploadFiles,
    removeAttachment,
    clearAttachments,
    handlePaste,
  };
}
