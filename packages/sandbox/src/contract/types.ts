import type { z } from "zod";
import type {
  ExecRequestSchema,
  ExecResponseSchema,
  FileReadRequestSchema,
  FileReadResponseSchema,
  FileWriteRequestSchema,
  FileWriteResponseSchema,
  GitCloneRequestSchema,
  GitCommitRequestSchema,
  GitPushRequestSchema,
  GitResponseSchema,
  HealthResponseSchema,
  EventsQuerySchema,
  ErrorResponseSchema,
} from "./schemas";

export type ExecRequest = z.infer<typeof ExecRequestSchema>;
export type ExecResponse = z.infer<typeof ExecResponseSchema>;

export type FileReadRequest = z.infer<typeof FileReadRequestSchema>;
export type FileReadResponse = z.infer<typeof FileReadResponseSchema>;

export type FileWriteRequest = z.infer<typeof FileWriteRequestSchema>;
export type FileWriteResponse = z.infer<typeof FileWriteResponseSchema>;

export type GitCloneRequest = z.infer<typeof GitCloneRequestSchema>;
export type GitCommitRequest = z.infer<typeof GitCommitRequestSchema>;
export type GitPushRequest = z.infer<typeof GitPushRequestSchema>;
export type GitResponse = z.infer<typeof GitResponseSchema>;

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type EventsQuery = z.infer<typeof EventsQuerySchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
