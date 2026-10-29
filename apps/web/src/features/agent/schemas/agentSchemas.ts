import {
  AttachmentSchema,
  IMAGE_CHOICE_AUTO,
  QuestionReplyDataSchema,
  QuestionSetDataSchema,
  ThemeOptionSchema,
} from "@repo/contracts";
import { z } from "zod";

export const sessionStatusSchema = z.enum([
  "IDLE",
  "RUNNING",
  "AWAITING_APPROVAL",
  "ERROR",
]);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;

export const PERMISSION_MODES = ["default", "accept-edits", "plan"] as const;
export type PermissionMode = (typeof PERMISSION_MODES)[number];

export const sessionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string().nullable(),
  model: z.string(),
  cost: z.number(),
  tokenIn: z.number(),
  tokenOut: z.number(),
  status: sessionStatusSchema,
  branch: z.string().nullable().optional(),
  worktreePath: z.string().nullable().optional(),
  mode: z.string().optional(),
  devPort: z.number().nullable().optional(),
  previewUrl: z.string().nullable().optional(),
  allowedTools: z.array(z.string()).optional(),
  createdAt: z.string(),
});
export type Session = z.infer<typeof sessionSchema>;

export const sessionPreviewSchema = z.object({
  devPort: z.number(),
  previewUrl: z.string().min(1),
});
export type SessionPreview = z.infer<typeof sessionPreviewSchema>;

export const msgSchema = z.object({
  id: z.string(),
  seq: z.number(),
  role: z.string(),
  type: z.enum(["text", "toolCall", "toolResponse"]),
  content: z.string(),
  data: z
    .object({
      toolCallId: z.string().optional(),
      toolName: z.string().optional(),
      args: z.record(z.string(), z.unknown()).optional(),
      stopReason: z.string().optional(),
      intake: z.boolean().optional(),
      attachments: z.array(AttachmentSchema).optional(),
      questionSet: QuestionSetDataSchema.optional().catch(undefined),
      questionReply: QuestionReplyDataSchema.optional().catch(undefined),
      theme: ThemeOptionSchema.optional().catch(undefined),
      blueprintId: z.string().optional(),
      imageChoice: z.literal(IMAGE_CHOICE_AUTO).optional().catch(undefined),
      planFeedback: z.array(z.string()).optional().catch(undefined),
      transcriptOnly: z.boolean().optional(),
      delegation: z.string().optional(),
      testingAgent: z.boolean().optional(),
      handoff: z.boolean().optional(),
      summaryTitle: z.string().optional(),
      summaryBullets: z.array(z.string()).optional(),
      summaryNote: z.string().optional(),
    })
    .nullable(),
  createdAt: z.string(),
});
export type Msg = z.infer<typeof msgSchema>;

export const modelCategorySchema = z.enum(["efficient", "standard", "frontier"]);
export type ModelCategory = z.infer<typeof modelCategorySchema>;

export const availableModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  description: z.string(),
  category: modelCategorySchema.optional(),
  badge: z.string().optional(),
  isDefault: z.boolean().optional(),
});
export type AvailableModel = z.infer<typeof availableModelSchema>;

export interface StopNotice {
  reason: string;
  detail: string;
}

export const approvalSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  messageId: z.string().nullable().optional(),
  toolCallId: z.string().nullable().optional(),
  toolName: z.string(),
  args: z.record(z.string(), z.unknown()),
  status: z.enum(["PENDING", "APPROVED", "DENIED"]),
  createdAt: z.string(),
  resolvedAt: z.string().nullable().optional(),
});
export type Approval = z.infer<typeof approvalSchema>;

export const diffFileSchema = z.object({
  path: z.string(),
  status: z.enum(["added", "modified", "deleted"]),
  diff: z.string(),
  additions: z.number(),
  deletions: z.number(),
});
export type DiffFile = z.infer<typeof diffFileSchema>;

export const mergeResultSchema = z.object({
  ok: z.boolean(),
  conflict: z.boolean(),
  message: z.string(),
  conflicts: z.array(z.string()).optional(),
});
export type MergeResult = z.infer<typeof mergeResultSchema>;
