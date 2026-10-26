import type { HTMLInputTypeAttribute } from "react";

export interface ContactFieldConfig {
  label: string;
  placeholder: string;
  type: HTMLInputTypeAttribute;
  autoComplete: string;
  inputMode?: "text" | "email" | "tel" | "url";
  required: boolean;
}

export const CONTACT_FIELDS: readonly ContactFieldConfig[] = [
  { label: "Phone", placeholder: "+91 98765 43210", type: "tel", autoComplete: "tel", inputMode: "tel", required: true },
  { label: "WhatsApp", placeholder: "+91 98765 43210", type: "tel", autoComplete: "tel", inputMode: "tel", required: false },
  { label: "Email", placeholder: "hello@yourbusiness.com", type: "email", autoComplete: "email", inputMode: "email", required: true },
  { label: "Address", placeholder: "Street, city, postcode", type: "text", autoComplete: "street-address", required: true },
];

const MAX_CONTACT_ANSWER_CHARS = 1000;
const EMPTY_VALUE = "—";
const PAIR_SEPARATOR = "; ";
const LABEL_SEPARATOR = ": ";

export function fieldsToShow(requested: readonly string[]): readonly ContactFieldConfig[] {
  if (requested.length === 0) return CONTACT_FIELDS;
  const wanted = new Set(requested);
  const matched = CONTACT_FIELDS.filter((field) => wanted.has(field.label));
  return matched.length > 0 ? matched : CONTACT_FIELDS;
}

export function encodeContactAnswer(values: Readonly<Record<string, string>>): string {
  const parts = CONTACT_FIELDS.map((field) => {
    const value = values[field.label]?.trim() ?? "";
    return `${field.label}${LABEL_SEPARATOR}${value.length > 0 ? value : EMPTY_VALUE}`;
  });
  return parts.join(PAIR_SEPARATOR).slice(0, MAX_CONTACT_ANSWER_CHARS);
}

export function decodeContactAnswer(encoded: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of CONTACT_FIELDS) {
    const match = new RegExp(`(?:^|${PAIR_SEPARATOR})${field.label}${LABEL_SEPARATOR}([^;]*)`).exec(encoded);
    const value = match?.[1]?.trim() ?? "";
    if (value.length > 0 && value !== EMPTY_VALUE) values[field.label] = value;
  }
  return values;
}

export function contactsAreFilled(encoded: string, requested: readonly string[] = []): boolean {
  const values = decodeContactAnswer(encoded);
  return fieldsToShow(requested).every((field) => !field.required || (values[field.label] ?? "").length > 0);
}
