import type { HTMLInputTypeAttribute } from "react";

export interface ContactFieldConfig {
  label: string;
  placeholder: string;
  type: HTMLInputTypeAttribute;
  autoComplete: string;
  inputMode?: "text" | "email" | "tel" | "url";
  required: boolean;
  group: "social" | "contact";
}

export const CONTACT_FIELDS: readonly ContactFieldConfig[] = [
  {
    label: "Instagram",
    placeholder: "https://instagram.com/yourbakery",
    type: "text",
    autoComplete: "url",
    inputMode: "url",
    required: false,
    group: "social",
  },
  {
    label: "Facebook",
    placeholder: "https://facebook.com/yourbakery",
    type: "text",
    autoComplete: "url",
    inputMode: "url",
    required: false,
    group: "social",
  },
  {
    label: "TikTok",
    placeholder: "https://tiktok.com/@yourbakery",
    type: "text",
    autoComplete: "url",
    inputMode: "url",
    required: false,
    group: "social",
  },
  {
    label: "Website",
    placeholder: "https://yourbakery.com",
    type: "text",
    autoComplete: "url",
    inputMode: "url",
    required: false,
    group: "social",
  },
  {
    label: "Phone",
    placeholder: "+91 98765 43210",
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel",
    required: true,
    group: "contact",
  },
  {
    label: "WhatsApp",
    placeholder: "+91 98765 43210",
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel",
    required: false,
    group: "contact",
  },
  {
    label: "Email",
    placeholder: "hello@yourbakery.com",
    type: "email",
    autoComplete: "email",
    inputMode: "email",
    required: true,
    group: "contact",
  },
  {
    label: "Support",
    placeholder: "support@yourbakery.com",
    type: "email",
    autoComplete: "email",
    inputMode: "email",
    required: false,
    group: "contact",
  },
  {
    label: "Address",
    placeholder: "Street, city, postcode",
    type: "text",
    autoComplete: "street-address",
    required: true,
    group: "contact",
  },
];

const MAX_CONTACT_ANSWER_CHARS = 1000;

export function fieldsToShow(requested: readonly string[]): readonly ContactFieldConfig[] {
  if (requested.length === 0) return CONTACT_FIELDS;
  const wanted = new Set(requested);
  const matched = CONTACT_FIELDS.filter((field) => wanted.has(field.label));
  return matched.length > 0 ? matched : CONTACT_FIELDS;
}

export function encodeContactAnswer(values: Readonly<Record<string, string>>): string {
  const parts = CONTACT_FIELDS.map((field) => {
    const value = values[field.label]?.trim() ?? "";
    return `${field.label}: ${value.length > 0 ? value : "—"}`;
  });
  const joined = parts.join("; ");
  return joined.length <= MAX_CONTACT_ANSWER_CHARS
    ? joined
    : joined.slice(0, MAX_CONTACT_ANSWER_CHARS);
}
