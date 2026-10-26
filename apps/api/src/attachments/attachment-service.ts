import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import type { Attachment } from "@repo/contracts";
import { createProjectAttachment, prisma } from "@repo/db";
import { extractPdf, processImageAttachment } from "@repo/media";

const ATTACHMENT_BASE_DIR =
  process.env.STORAGE_DIR || join(process.cwd(), ".workspaces", "attachments");

export interface StoreAttachmentInput {
  projectId: string;
  sessionId?: string;
  filename: string;
  mimeType: string;
  type: "image" | "pdf" | "document";
  extension: string;
  bytes: Uint8Array;
}

export async function storeAndIngestAttachment(
  input: StoreAttachmentInput,
): Promise<Attachment> {
  const { projectId, sessionId, filename, mimeType, type, extension, bytes } = input;

  const projectDir = join(ATTACHMENT_BASE_DIR, projectId);
  await mkdir(projectDir, { recursive: true });

  const randomSuffix = randomBytes(6).toString("hex");
  const storageKey = `att_${Date.now()}_${randomSuffix}.${extension}`;
  const filePath = join(projectDir, storageKey);
  await writeFile(filePath, bytes);

  let width: number | undefined;
  let height: number | undefined;
  let dataUrl: string | undefined;
  let pageCount: number | undefined;
  let extractedText: string | undefined;

  if (type === "image") {
    const processed = processImageAttachment(bytes, mimeType);
    if (processed.ok) {
      width = processed.data.width;
      height = processed.data.height;
      dataUrl = processed.data.dataUrl;
    }
  } else if (type === "pdf") {
    const extracted = await extractPdf(bytes, { maxPages: 50, renderScreenshots: false });
    if (extracted.ok) {
      pageCount = extracted.data.totalPages;
      extractedText = extracted.data.fullText;
    }
    const base64 = Buffer.from(bytes).toString("base64");
    dataUrl = `data:application/pdf;base64,${base64}`;
  }

  let resolvedSessionId = sessionId;
  if (resolvedSessionId) {
    const session = await prisma.session.findUnique({
      where: { id: resolvedSessionId },
      select: { id: true, projectId: true },
    });
    if (!session || session.projectId !== projectId) {
      resolvedSessionId = undefined;
    }
  }

  if (!resolvedSessionId) {
    const latest = await prisma.session.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    resolvedSessionId = latest?.id;
  }

  if (!resolvedSessionId) {
    const created = await prisma.session.create({
      data: { projectId, model: "gpt-5.4-mini" },
      select: { id: true },
    });
    resolvedSessionId = created.id;
  }

  const record = await createProjectAttachment({
    projectId,
    sessionId: resolvedSessionId,
    name: filename,
    mimeType,
    sizeBytes: bytes.length,
    storageKey,
    type,
    metadata: {
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
      ...(pageCount ? { pageCount } : {}),
    },
    extractedText,
  });

  return {
    id: record.id,
    name: record.name,
    mimeType: record.mimeType,
    type,
    sizeBytes: record.sizeBytes,
    storageKey: record.storageKey,
    status: "COMPLETED",
    url: `/v1/projects/${projectId}/attachments/${record.id}/download`,
    dataUrl,
    width,
    height,
    pageCount,
    extractedText,
  };
}
