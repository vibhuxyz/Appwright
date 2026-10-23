export const CONTACT_FIELD_LABELS = [
  "Instagram",
  "Facebook",
  "TikTok",
  "Website",
  "Phone",
  "WhatsApp",
  "Email",
  "Support",
  "Address",
] as const;

export type ContactFieldLabel = (typeof CONTACT_FIELD_LABELS)[number];

const MAX_CONTACT_ANSWER_CHARS = 1000;
const REQUIRED_CONTACT_FIELDS: readonly ContactFieldLabel[] = ["Phone", "Email", "Address"];

function clip(value: string, max = 200): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function asHttps(value: string, host: string): string {
  const trimmed = clip(value);
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  return `https://${host}/${handle}`;
}

function assignSocial(prefill: Record<string, string>, raw: string): void {
  for (const part of raw.split(/[,]+/).map((item) => item.trim()).filter(Boolean)) {
    const lower = part.toLowerCase();
    if (lower.includes("instagram.com") || /\binstagram\b/i.test(part)) {
      prefill.Instagram = asHttps(part.replace(/^instagram\s*(?:is|:|@)?\s*/i, ""), "instagram.com");
    } else if (lower.includes("facebook.com") || lower.includes("fb.com") || /\bfacebook\b/i.test(part)) {
      prefill.Facebook = asHttps(part.replace(/^facebook\s*(?:is|:|@)?\s*/i, ""), "facebook.com");
    } else if (lower.includes("tiktok.com") || /\btiktok\b/i.test(part)) {
      prefill.TikTok = asHttps(part.replace(/^tiktok\s*(?:is|:|@)?\s*/i, ""), "tiktok.com");
    } else if (/^https?:\/\//i.test(part) && !/wa\.me\//i.test(part)) {
      prefill.Website = clip(part);
    }
  }
}

export function contactPrefillFrom(answered: Readonly<Record<string, string>>): Record<string, string> {
  const prefill: Record<string, string> = {};
  const social = answered["business-social"];
  if (social) assignSocial(prefill, social);
  const phone = answered["business-contact"];
  if (phone) prefill.Phone = clip(phone);
  const whatsapp = answered["business-whatsapp"];
  if (whatsapp) prefill.WhatsApp = clip(whatsapp);
  const email = answered["business-email"];
  if (email) prefill.Email = clip(email);
  const support = answered["business-support"];
  if (support) prefill.Support = clip(support);
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
