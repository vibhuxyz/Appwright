const MAX_IDENTITY_CHARS = 120;
const NAME_STOP = /\s+(?:where\b|and\s+(?:the\s+)?(?:address|email|phone|instagram|facebook)|located\b)|[.!?,;]/i;

const NAME_LEADINS: readonly RegExp[] = [
  /(?:my|our|the)\s+business(?:'s)?\s+name\s*(?:is|:)\s+/gi,
  /business\s+name\s*(?:is|:)\s+/gi,
  /name of (?:my|our|the)\s+(?:business|bakery|shop|store|cafe|restaurant)\s+is\s+/gi,
  /(?:the\s+)?(?:bakery|shop|store|cafe|restaurant)\s+(?:is\s+)?(?:called|named)\s+/gi,
  /(?:we're|we are)\s+(?:called|named)\s+/gi,
  /(?:called|named)\s+["“']([^"”']+)["”']/gi,
];

function clip(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_IDENTITY_CHARS);
}

function isGenericName(name: string): boolean {
  return /^(a |an |the )?(bakery|business|shop|store|cafe|restaurant|app|website)\b/i.test(
    name,
  );
}

function takeAfterLeadin(prompt: string, leadin: RegExp): string | undefined {
  leadin.lastIndex = 0;
  let found: string | undefined;
  for (const match of prompt.matchAll(leadin)) {
    const quoted = match[1] ? clip(match[1]) : "";
    if (quoted.length >= 2 && !isGenericName(quoted)) {
      found = quoted;
      continue;
    }
    const rest = prompt.slice(match.index + match[0].length);
    const cut = rest.split(NAME_STOP)[0] ?? rest;
    const name = clip(cut.replace(/^["“']|["”']$/g, ""));
    if (name.length >= 2 && !isGenericName(name)) found = name;
  }
  return found;
}

export function extractBusinessName(prompt: string): string | undefined {
  for (const leadin of NAME_LEADINS) {
    const name = takeAfterLeadin(prompt, leadin);
    if (name) return name;
  }
  return undefined;
}

export function extractBusinessEmail(prompt: string): string | undefined {
  const match = prompt.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  return match?.[0];
}

export function extractBusinessPhone(prompt: string): string | undefined {
  const match = prompt.match(
    /(?:phone|mobile|tel(?:ephone)?|contact number)\s*(?:is|:)?\s*(\+?\d[\d\s().-]{7,18}\d)/i,
  );
  return match?.[1] ? clip(match[1]) : undefined;
}

export function extractBusinessWhatsapp(prompt: string): string | undefined {
  const waMe = prompt.match(/https?:\/\/wa\.me\/(\+?\d{7,18})/i);
  if (waMe?.[1]) return clip(waMe[1]);
  const match = prompt.match(
    /whatsapp\s*(?:number|no\.?)?\s*(?:is|:)?\s*(\+?\d[\d\s().-]{7,18}\d)/i,
  );
  return match?.[1] ? clip(match[1]) : undefined;
}

export function extractBusinessAddress(prompt: string): string | undefined {
  const match = prompt.match(
    /(?:address|located at|find us at|we're at|we are at)\s*(?:is|:)?\s*(.+?)(?:[.!?]|$)/i,
  );
  const address = match?.[1] ? clip(match[1]) : "";
  if (address.length < 4) return undefined;
  return address;
}

export function extractBusinessSocial(prompt: string): string | undefined {
  const found: string[] = [];
  const seen = new Set<string>();
  const push = (value: string) => {
    const clipped = clip(value.replace(/[),.;]+$/g, ""));
    const key = clipped.toLowerCase();
    if (clipped.length < 3 || seen.has(key)) return;
    seen.add(key);
    found.push(clipped);
  };
  for (const match of prompt.matchAll(/https?:\/\/[^\s]+/gi)) {
    if (!match[0] || /wa\.me\//i.test(match[0])) continue;
    push(match[0]);
  }
  for (const match of prompt.matchAll(
    /(?:instagram|facebook|tiktok|twitter)\s*(?:is|:|@)?\s*@?([\w./]+)/gi,
  )) {
    if (match[0]) push(match[0]);
  }
  return found.length > 0 ? found.join(", ").slice(0, MAX_IDENTITY_CHARS) : undefined;
}

export function extractBusinessSupport(prompt: string): string | undefined {
  const labeled = prompt.match(
    /support(?:\s+(?:email|contact|inbox))?\s*(?:is|:)\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
  );
  if (labeled?.[1]) return labeled[1];
  const emails = [...prompt.matchAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi)].map(
    (match) => match[0],
  );
  return emails.find((email) => email.toLowerCase().startsWith("support@"));
}

export function extractIdentityFromPrompt(prompt: string): Record<string, string> {
  const identity: Record<string, string> = {};
  const name = extractBusinessName(prompt);
  if (name) identity["business-name"] = name;
  const email = extractBusinessEmail(prompt);
  if (email) identity["business-email"] = email;
  const phone = extractBusinessPhone(prompt);
  if (phone) identity["business-contact"] = phone;
  const whatsapp = extractBusinessWhatsapp(prompt);
  if (whatsapp) identity["business-whatsapp"] = whatsapp;
  const address = extractBusinessAddress(prompt);
  if (address) identity["business-address"] = address;
  const social = extractBusinessSocial(prompt);
  if (social) identity["business-social"] = social;
  const support = extractBusinessSupport(prompt);
  if (support) identity["business-support"] = support;
  return identity;
}
