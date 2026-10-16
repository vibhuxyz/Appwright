import { z } from "zod";

export const ExecRequestSchema = z.object({
  argv: z.array(z.string()).min(1),
  cwd: z.string().optional(),
  timeoutMs: z.number().int().positive().optional(),
  env: z.record(z.string(), z.string()).optional(),
});

export const ExecResponseSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
  code: z.number().int(),
});

export const FileReadRequestSchema = z.object({
  path: z.string().min(1),
});

export const FileReadResponseSchema = z.object({
  content: z.string(),
  truncated: z.boolean(),
});

export const FileWriteRequestSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
});

export const FileWriteResponseSchema = z.object({
  ok: z.boolean(),
});

export const GitCloneRequestSchema = z.object({
  repoUrl: z.string().min(1),
  targetDir: z.string().min(1),
  branch: z.string().optional(),
});

export const GitCommitRequestSchema = z.object({
  cwd: z.string().optional(),
  message: z.string().min(1),
  authorName: z.string().optional(),
  authorEmail: z.string().optional(),
});

export const GitPushRequestSchema = z.object({
  cwd: z.string().optional(),
  remote: z.string().optional(),
  branch: z.string().optional(),
});

export const GitResponseSchema = z.object({
  ok: z.boolean(),
  sha: z.string().optional(),
  output: z.string().optional(),
});

export const HealthResponseSchema = z.object({
  ok: z.boolean(),
  leaseExpiresAt: z.string(),
  uptimeSeconds: z.number(),
});

export const EventsQuerySchema = z.object({
  afterSeq: z.coerce.number().int().optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});
