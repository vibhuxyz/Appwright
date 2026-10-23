import type { FieldDescriptor } from "../session";

export type FormScenario = "empty" | "invalid-email" | "valid";

export const INVALID_EMAIL = "not-an-email";

const VALID_EMAIL = "qa.tester@example.test";
const VALID_PASSWORD = "Test-Pass-123!";
const VALID_PHONE = "+15555550123";
const VALID_URL = "https://example.test";
const VALID_DATE = "2030-01-15";
const DEFAULT_NUMBER = 1;
const DEFAULT_TEXT = "Test value";

const TEXT_BY_NAME: readonly (readonly [RegExp, string])[] = [
  [/first/i, "Test"],
  [/last|surname/i, "Tester"],
  [/zip|postal/i, "10001"],
  [/city|town/i, "Springfield"],
  [/address|street/i, "1 Test Street"],
  [/phone|mobile/i, VALID_PHONE],
  [/company|business/i, "Test Company"],
  [/subject|title/i, "Test enquiry"],
  [/message|comment|note|detail|request|description|feedback/i, "This is an automated test message. Please ignore it."],
  [/name/i, "Test User"],
];

function numberFor(field: FieldDescriptor): number {
  const atLeastMin = Math.max(field.min ?? DEFAULT_NUMBER, DEFAULT_NUMBER);
  return Math.min(field.max ?? Number.POSITIVE_INFINITY, atLeastMin);
}

function textFor(field: FieldDescriptor): string {
  const hint = `${field.name} ${field.label}`;
  return TEXT_BY_NAME.find(([pattern]) => pattern.test(hint))?.[1] ?? DEFAULT_TEXT;
}

export function valueFor(field: FieldDescriptor, scenario: FormScenario): string {
  switch (field.kind) {
    case "email":
      return scenario === "invalid-email" ? INVALID_EMAIL : VALID_EMAIL;
    case "password":
      return VALID_PASSWORD;
    case "tel":
      return VALID_PHONE;
    case "number":
      return String(numberFor(field));
    case "url":
      return VALID_URL;
    case "date":
      return VALID_DATE;
    case "textarea":
    case "text":
      return textFor(field);
    case "select":
    case "checkbox":
    case "radio":
    case "file":
      return "";
    default: {
      const unreachable: never = field.kind;
      return unreachable;
    }
  }
}
