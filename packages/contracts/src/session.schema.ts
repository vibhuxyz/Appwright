import z from "zod";
import { ElementSelectionSchema } from "./element-selection.schema";

export const SessionStatus = z.enum([
  "IDLE",
  "RUNNING",
  "AWAITING_APPROVAL",
  "ERROR",
]);

export const CreateSessionRequest = z.object({
  title: z.string().optional(),
});

export const SessionPermissionModeSchema = z.enum([
  "default",
  "accept-edits",
  "bypass",
  "plan",
]);

export const UpdateSessionRequest = z
  .object({
    model: z.string().min(1).optional(),
    mode: SessionPermissionModeSchema.optional(),
    allowedTools: z.array(z.string()).optional(),
  })
  .refine(
    (body) =>
      body.model !== undefined ||
      body.mode !== undefined ||
      body.allowedTools !== undefined,
    {
      message: "model, mode, or allowedTools is required",
    },
  );

export const SessionResponse = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string().nullable(),
  model: z.string(),
  cost: z.number(),
  tokenIn: z.number(),
  tokenOut: z.number(),
  status: SessionStatus,
  branch: z.string().nullable().optional(),
  worktreePath: z.string().nullable().optional(),
  mode: z.string().optional(),
  devPort: z.number().nullable().optional(),
  previewUrl: z.string().nullable().optional(),
  allowedTools: z.array(z.string()).optional(),
  createdAt: z.string(),
});

export const SessionPreviewResponse = z.object({
  devPort: z.number(),
  previewUrl: z.string().min(1),
});

export const PromptAnswerValue = z.union([z.string().min(1).max(200), z.literal("skip")]);

export const PromptQuestionSchema = z
  .object({
    need: z.string().min(1).max(40),
    text: z.string().min(1).max(200),
    label: z.string().min(1).max(40),
    options: z.array(z.string().min(1).max(60)).min(2).max(4),
    defaultOptionIndex: z.number().int().min(0),
  })
  .refine((question) => question.defaultOptionIndex < question.options.length, {
    message: "defaultOptionIndex must index into options",
    path: ["defaultOptionIndex"],
  });

export const SendMessageRequest = z.object({
  sessionId: z.string(),
  prompt: z.string().min(1),
  answers: z.record(z.string(), PromptAnswerValue).optional(),
  questions: z.array(PromptQuestionSchema).max(3).optional(),
  selection: ElementSelectionSchema.optional(),
});

export const PromptQuestionsRequest = z.object({
  prompt: z.string().trim().min(1),
});

export const PromptQuestionsResponse = z.object({
  questions: z.array(PromptQuestionSchema).max(3),
});

export const EnhancePromptRequest = z.object({
  prompt: z.string().min(1),
  context: z.string().optional(),
});

export const EnhancePromptResponse = z.object({
  enhancedPrompt: z.string(),
  suggestions: z.array(z.string()).optional(),
});

export const AvailableModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  description: z.string(),
  badge: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequest>;
export type UpdateSessionRequest = z.infer<typeof UpdateSessionRequest>;
export type SessionResponse = z.infer<typeof SessionResponse>;
export type SessionPreviewResponse = z.infer<typeof SessionPreviewResponse>;
export type SendMessageRequest = z.infer<typeof SendMessageRequest>;
export type PromptAnswerValue = z.infer<typeof PromptAnswerValue>;
export type PromptQuestionsRequest = z.infer<typeof PromptQuestionsRequest>;
export type PromptQuestion = z.infer<typeof PromptQuestionSchema>;
export type PromptQuestionsResponse = z.infer<typeof PromptQuestionsResponse>;
export type EnhancePromptRequest = z.infer<typeof EnhancePromptRequest>;
export type EnhancePromptResponse = z.infer<typeof EnhancePromptResponse>;
export type AvailableModel = z.infer<typeof AvailableModelSchema>;

export const ApprovalStatus = z.enum(["PENDING", "APPROVED", "DENIED"]);
export type ApprovalStatus = z.infer<typeof ApprovalStatus>;

export const ApprovalResponse = z.object({
  id: z.string(),
  sessionId: z.string(),
  messageId: z.string().nullable().optional(),
  toolCallId: z.string().nullable().optional(),
  toolName: z.string(),
  args: z.record(z.string(), z.unknown()),
  status: ApprovalStatus,
  createdAt: z.string(),
  resolvedAt: z.string().nullable().optional(),
});
export type ApprovalResponse = z.infer<typeof ApprovalResponse>;

export const ResolveApprovalRequest = z.object({
  status: z.enum(["APPROVED", "DENIED"]),
  alwaysAllowTool: z.boolean().optional(),
});
export type ResolveApprovalRequest = z.infer<typeof ResolveApprovalRequest>;

export const DiffFileResponse = z.object({
  path: z.string(),
  status: z.enum(["added", "modified", "deleted"]),
  diff: z.string(),
  additions: z.number(),
  deletions: z.number(),
});
export type DiffFileResponse = z.infer<typeof DiffFileResponse>;

export const MergeSessionResponse = z.object({
  ok: z.boolean(),
  conflict: z.boolean(),
  message: z.string(),
  conflicts: z.array(z.string()).optional(),
});
export type MergeSessionResponse = z.infer<typeof MergeSessionResponse>;

export const VerificationErrorSchema = z.object({
  file: z.string().optional(),
  line: z.number().optional(),
  col: z.number().optional(),
  message: z.string(),
});
export type VerificationError = z.infer<typeof VerificationErrorSchema>;

export const VerificationResultSchema = z.object({
  ok: z.boolean(),
  check: z.enum(["tsc", "build", "lint"]),
  errors: z.array(VerificationErrorSchema),
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

