import type {
  Prisma,
  ProjectAttachment,
} from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import type {
  CreateAttachmentRecordInput,
  UpdateAttachmentRecordInput,
} from "./types";

export async function createProjectAttachment(
  input: CreateAttachmentRecordInput,
): Promise<ProjectAttachment> {
  const typeMap = {
    image: "IMAGE",
    pdf: "PDF",
    document: "DOCUMENT",
  } as const;

  const prismaType =
    input.type in typeMap
      ? typeMap[input.type as keyof typeof typeMap]
      : "DOCUMENT";

  const metadata = input.metadata as unknown as Prisma.InputJsonValue | undefined;

  return prisma.projectAttachment.create({
    data: {
      project: { connect: { id: input.projectId } },
      session: { connect: { id: input.sessionId } },
      ...(input.messageId ? { messageId: input.messageId } : {}),
      name: input.name,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storageKey: input.storageKey,
      type: prismaType,
      status: "COMPLETED",
      metadata,
      extractedText: input.extractedText,
    },
  });
}

export async function updateAttachmentRecord(
  id: string,
  input: UpdateAttachmentRecordInput,
): Promise<ProjectAttachment> {
  const metadata = input.metadata as unknown as Prisma.InputJsonValue | undefined;
  const analysis = input.analysis as unknown as Prisma.InputJsonValue | undefined;

  return prisma.projectAttachment.update({
    where: { id },
    data: {
      status: input.status,
      metadata,
      extractedText: input.extractedText,
      analysis,
      errorMessage: input.errorMessage,
    },
  });
}

export async function getProjectAttachments(
  projectId: string,
  sessionId?: string,
): Promise<ProjectAttachment[]> {
  return prisma.projectAttachment.findMany({
    where: {
      projectId,
      ...(sessionId ? { sessionId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAttachmentById(
  id: string,
): Promise<ProjectAttachment | null> {
  return prisma.projectAttachment.findUnique({
    where: { id },
  });
}

export async function deleteProjectAttachment(id: string): Promise<boolean> {
  const deleted = await prisma.projectAttachment.delete({
    where: { id },
  }).catch(() => null);
  return deleted !== null;
}
