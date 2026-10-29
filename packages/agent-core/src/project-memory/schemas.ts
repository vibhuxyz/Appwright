import { TurnCheckpointSchema } from "@repo/contracts";
import { z } from "zod";

export const CheckpointDataSchema = z.object({ checkpoint: TurnCheckpointSchema });

export const QuestionItemsSchema = z.array(
  z.object({
    label: z.string(),
    text: z.string(),
    options: z.array(z.string()),
    defaultOptionIndex: z.number().int(),
  }),
);

export const VerificationSchema = z.object({
  verification: z.array(
    z.object({
      ok: z.boolean(),
      check: z.string(),
      errors: z.array(z.unknown()).default([]),
    }),
  ).min(1),
});

export function parseOr<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}
