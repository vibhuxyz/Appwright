import { z } from "zod";
import { FIELD_KINDS, type ClickTarget, type FormDescriptor, type InvalidField } from "./interaction-types";

const FormsSchema = z.array(
  z.object({
    index: z.number(),
    label: z.string(),
    hasSubmit: z.boolean(),
    fields: z.array(
      z.object({
        index: z.number(),
        kind: z.enum(FIELD_KINDS),
        name: z.string(),
        label: z.string(),
        required: z.boolean(),
        min: z.number().nullable(),
        max: z.number().nullable(),
      }),
    ),
  }),
);

const ClickTargetsSchema = z.array(z.object({ index: z.number(), name: z.string() }));
const StateSchema = z.object({ lines: z.array(z.string()), dialog: z.boolean() });
const InvalidFieldsSchema = z.array(z.object({ label: z.string(), message: z.string() }));

export interface PageState {
  readonly lines: readonly string[];
  readonly dialog: boolean;
}

export function parseForms(raw: unknown): FormDescriptor[] {
  return FormsSchema.parse(raw);
}

export function parseClickTargets(raw: unknown): ClickTarget[] {
  return ClickTargetsSchema.parse(raw);
}

export function parsePageState(raw: unknown): PageState {
  return StateSchema.parse(raw);
}

export function parseInvalidFields(raw: unknown): InvalidField[] {
  return InvalidFieldsSchema.parse(raw);
}
