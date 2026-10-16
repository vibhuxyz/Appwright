import type { Prisma, Project, Session, Message, Approval } from "@repo/db";

export type { Project, Session, Message, Approval };

export interface CreateProjectInput {
  name: string;
  templateId?: string;
  workspacePath: string;
}

export interface CreateSessionInput {
  projectId: string;
  model?: string;
  title?: string;
}

export interface CreateMessageInput {
  sessionId: string;
  seq: number;
  role: string;
  type: string;
  content: string;
  data?: Prisma.InputJsonValue;
}
