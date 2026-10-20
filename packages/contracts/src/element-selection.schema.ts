import z from "zod";

export const ELEMENT_SELECTION_LIMITS = {
  route: 200,
  tag: 40,
  text: 300,
  classes: 400,
  selector: 400,
  html: 1500,
} as const;

export const ElementSelectionSchema = z.object({
  route: z.string().max(ELEMENT_SELECTION_LIMITS.route),
  tag: z.string().min(1).max(ELEMENT_SELECTION_LIMITS.tag),
  text: z.string().max(ELEMENT_SELECTION_LIMITS.text),
  classes: z.string().max(ELEMENT_SELECTION_LIMITS.classes),
  selector: z.string().max(ELEMENT_SELECTION_LIMITS.selector),
  html: z.string().max(ELEMENT_SELECTION_LIMITS.html),
});

export type ElementSelection = z.infer<typeof ElementSelectionSchema>;
