import type { ExtractedFacts } from "./types";

export const CONTACT_FIELD_LABELS = ["Phone", "WhatsApp", "Email", "Address"] as const;

export type ContactFieldLabel = (typeof CONTACT_FIELD_LABELS)[number];

const MAX_CONTACT_ANSWER_CHARS = 1000;
const LOCAL_BUSINESS =
  /\b(clinic|salon|restaurant|caf[eé]|gym|shop|store|studio|showroom|walk-?in|visit us|storefront|branch|address|office)\b/i;
const PHONE_MENTION = /\b(phone|calls?|calling)\b/i;
const REQUIRED_CONTACT_FIELDS: readonly ContactFieldLabel[] = ["Phone", "Email", "Address"];

function clip(value: string, max = 200): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function contactPrefillFrom(answered: Readonly<Record<string, string>>): Record<string, string> {
  const prefill: Record<string, string> = {};
  const phone = answered["business-contact"];
  if (phone) prefill.Phone = clip(phone);
  const whatsapp = answered["business-whatsapp"];
  if (whatsapp) prefill.WhatsApp = clip(whatsapp);
  const email = answered["business-email"];
  if (email) prefill.Email = clip(email);
  const address = answered["business-address"];
  if (address) prefill.Address = clip(address);
  return prefill;
}

export function encodeContactAnswer(prefill: Readonly<Record<string, string>>): string {
  const parts = CONTACT_FIELD_LABELS.map((label) => {
    const value = prefill[label]?.trim() ?? "";
    return `${label}: ${value.length > 0 ? value : "—"}`;
  });
  const joined = parts.join("; ");
  return joined.length <= MAX_CONTACT_ANSWER_CHARS
    ? joined
    : joined.slice(0, MAX_CONTACT_ANSWER_CHARS);
}

export function contactsAreComplete(prefill: Readonly<Record<string, string>>): boolean {
  return REQUIRED_CONTACT_FIELDS.every((label) => (prefill[label] ?? "").trim().length > 0);
}

function isLocalBusiness(facts: ExtractedFacts): boolean {
  const { signals } = facts;
  const sellsLocally =
    signals.bakery || signals.storefront || signals.pickup || signals.delivery || signals.popups || signals.ordering;
  return sellsLocally || LOCAL_BUSINESS.test(facts.prompt);
}

export function contactFieldsFor(facts: ExtractedFacts): readonly ContactFieldLabel[] {
  if (isLocalBusiness(facts)) return CONTACT_FIELD_LABELS;
  const wanted = new Set<ContactFieldLabel>(["Email", "WhatsApp"]);
  if (PHONE_MENTION.test(facts.prompt)) wanted.add("Phone");
  return CONTACT_FIELD_LABELS.filter((label) => wanted.has(label));
}
