import { z } from "zod";

export const TurnCheckpointSchema = z.object({
  sha: z.string().regex(/^[0-9a-f]{40}$/),
  isTurnCommit: z.literal(true),
});
export type TurnCheckpoint = z.infer<typeof TurnCheckpointSchema>;

export const RevertedTurnSchema = z.object({
  sha: z.string().min(1),
  revertSha: z.string().min(1),
  fromSeq: z.number().int().nonnegative(),
  toSeq: z.number().int().nonnegative(),
  fromAt: z.string().min(1),
  toAt: z.string().min(1),
  mainUpdated: z.boolean(),
  mainError: z.string().optional(),
});
export type RevertedTurn = z.infer<typeof RevertedTurnSchema>;

const CheckpointDataSchema = z.object({ checkpoint: TurnCheckpointSchema });
const RevertMarkerDataSchema = z.object({ revertMarker: z.literal(true), revertedTurn: RevertedTurnSchema });

export function checkpointShaOf(data: unknown): string | undefined {
  const parsed = CheckpointDataSchema.safeParse(data);
  return parsed.success ? parsed.data.checkpoint.sha : undefined;
}

export function revertedTurnOf(data: unknown): RevertedTurn | undefined {
  const parsed = RevertMarkerDataSchema.safeParse(data);
  return parsed.success ? parsed.data.revertedTurn : undefined;
}
