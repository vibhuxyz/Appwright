import z from "zod";
import { DesignBlockSchema, LayoutBlockSchema } from "./blueprint.schema";

export const DesignDirectionPreviewSchema = z.object({
  header: z.string(),
  hero: z.string(),
  layout: z.string(),
  colorPalette: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  typography: z.string(),
});
export type DesignDirectionPreview = z.infer<typeof DesignDirectionPreviewSchema>;

export const DesignDirectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  preview: DesignDirectionPreviewSchema,
  design: DesignBlockSchema,
  layout: LayoutBlockSchema,
  isDefault: z.boolean(),
});
export type DesignDirection = z.infer<typeof DesignDirectionSchema>;

export const DesignReviewChoiceRequestSchema = z.object({
  directionId: z.string().min(1),
});
export type DesignReviewChoiceRequest = z.infer<typeof DesignReviewChoiceRequestSchema>;

export const DesignDirectionsResponse = z.object({
  directions: z.array(DesignDirectionSchema),
});
export type DesignDirectionsResponse = z.infer<typeof DesignDirectionsResponse>;
