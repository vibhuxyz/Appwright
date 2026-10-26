import { z } from "zod";

export const IntentSchema = z.object({
  type: z.string(),
  domain: z.string(),
  complexity: z.string(),
});

export const PagesSchema = z.array(z.object({ route: z.string(), purpose: z.string() }));

export const FeaturesSchema = z.array(z.string());

export const RequirementsSchema = z.array(
  z.object({
    area: z.string(),
    level: z.string(),
    acceptance: z.array(z.string()).default([]),
  }),
);

export const OwnsSchema = z.array(z.string());

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
