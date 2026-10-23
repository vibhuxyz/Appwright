const MAX_PROMPT_CHARS = 4000;

const INTENT_INSTRUCTIONS = `You classify a request to build or change software.

Read the user request and return ONLY JSON:
{"type":"<a short kebab-case label for what they want, e.g. 'new-app' or 'add-feature'>","domain":"<a short kebab-case label for the product domain, e.g. 'food-delivery' or 'todo-list'>","complexity":"simple"|"medium"|"complex","projectType":"business-site"|"marketplace"|"portfolio"|"saas"|"wallet"|"other"}

Rules:
- "simple" is a cosmetic tweak or a one-field change.
- "medium" is one new feature or page on an existing idea.
- "complex" is a new multi-entity application.
- "projectType" is "business-site" for a website that presents a business (bakery, restaurant, clinic, shop catalog), "marketplace" for buyers and sellers, "portfolio" for a person's or studio's work, "saas" for a logged-in tool or dashboard, "wallet" for money balances or ledgers, otherwise "other".

User request:
`;

function clip(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max).trimEnd();
}

function escapeRequest(text: string): string {
  return text.replaceAll("</user-request>", "<\\/user-request>");
}

export function buildIntentPrompt(prompt: string): string {
  const request = clip(escapeRequest(prompt), MAX_PROMPT_CHARS);
  return `${INTENT_INSTRUCTIONS}<user-request>\n${request}\n</user-request>`;
}
