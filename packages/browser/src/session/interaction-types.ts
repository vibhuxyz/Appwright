export const FIELD_KINDS = [
  "text",
  "email",
  "password",
  "tel",
  "number",
  "url",
  "date",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "file",
] as const;
export type FieldKind = (typeof FIELD_KINDS)[number];

export interface FieldDescriptor {
  readonly index: number;
  readonly kind: FieldKind;
  readonly name: string;
  readonly label: string;
  readonly required: boolean;
  readonly min: number | null;
  readonly max: number | null;
}

export interface FormDescriptor {
  readonly index: number;
  readonly label: string;
  readonly fields: readonly FieldDescriptor[];
  readonly hasSubmit: boolean;
}

export interface ClickTarget {
  readonly index: number;
  readonly name: string;
}

export interface RequestRecord {
  readonly method: string;
  readonly path: string;
  readonly status: number | null;
}

export interface InvalidField {
  readonly label: string;
  readonly message: string;
}

export type ActionResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: string };

export interface InteractionOutcome {
  readonly urlChanged: boolean;
  readonly newText: readonly string[];
  readonly invalidFields: readonly InvalidField[];
  readonly dialogShown: boolean;
  readonly requests: readonly RequestRecord[];
}
