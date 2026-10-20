import { z } from "zod";

export const MAX_CONFLICT_FILES = 100;
export const MAX_SIDE_BYTES = 200_000;

export const ConflictSide = z.enum(["main", "session"]);
export type ConflictSide = z.infer<typeof ConflictSide>;

export const ConflictResolution = z.object({
  path: z.string().min(1),
  side: ConflictSide,
});
export type ConflictResolution = z.infer<typeof ConflictResolution>;

export const ResolveConflictsRequest = z.object({
  resolutions: z.array(ConflictResolution).min(1).max(MAX_CONFLICT_FILES),
});
export type ResolveConflictsRequest = z.infer<typeof ResolveConflictsRequest>;

export interface ConflictFile {
  path: string;
  main: string | null;
  session: string | null;
  isTruncated: boolean;
}

export type ConflictReport =
  | { hasConflict: false }
  | { hasConflict: true; files: ConflictFile[]; skipped: number };

export type ResolveResult =
  | { ok: true; message: string }
  | {
      ok: false;
      reason: "no-conflict" | "unresolved" | "unknown-path" | "failed";
      message: string;
      unresolved?: string[];
    };
